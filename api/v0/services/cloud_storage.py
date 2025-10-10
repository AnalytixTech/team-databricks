import os
import uuid
from typing import Optional, BinaryIO
from flask import current_app
import oci
from oci.object_storage import ObjectStorageClient
from oci.exceptions import ServiceError

class CloudStorageService:
    """Oracle Cloud Infrastructure Object Storage service for handling file uploads"""
    
    def __init__(self):
        self._client = None
    
    @property
    def client(self):
        """Get Oracle Object Storage client"""
        if self._client is None:
            self._client = self._get_oci_client()
        return self._client
    
    def _get_oci_client(self):
        """Get Oracle Cloud Infrastructure Object Storage client using environment variables"""
        
        key_file = os.environ.get('OCI_CLI_KEY_FILE')
        key_content = current_app.config.get('OCI_CLI_KEY_CONTENT')
        
        if key_file:
            # Use private key file path with required OCI environment variables
            config = {
                'user': os.environ.get('OCI_CLI_USER'),
                'tenancy': os.environ.get('OCI_CLI_TENANCY'),
                'fingerprint': os.environ.get('OCI_CLI_FINGERPRINT'),
                'key_file': key_file,
                'region': current_app.config.get('OCI_REGION')
            }
        elif key_content:
            # Use private key content directly with required OCI environment variables
            config = {
                'user': os.environ.get('OCI_CLI_USER'),
                'tenancy': os.environ.get('OCI_CLI_TENANCY'),
                'fingerprint': os.environ.get('OCI_CLI_FINGERPRINT'),
                'key_content': key_content,
                'region': current_app.config.get('OCI_REGION')
            }
        else:
            # Use default OCI config file location (~/.oci/config)
            config = oci.config.from_file()
        
        return ObjectStorageClient(config)
    
    def upload_file(self, file: BinaryIO, file_path: str, content_type: str = None) -> Optional[str]:
        """Upload file to Oracle Object Storage"""
        try:
            return self._upload_to_oci(file, file_path, content_type)
        except Exception as e:
            current_app.logger.error(f"Failed to upload file {file_path}: {str(e)}")
            return None
    
    def _upload_to_oci(self, file: BinaryIO, file_path: str, content_type: str = None) -> str:
        """Upload file to Oracle Object Storage"""
        bucket_name = current_app.config.get('OCI_BUCKET_NAME')
        namespace = current_app.config.get('OCI_NAMESPACE')
        
        if not bucket_name:
            raise ValueError("OCI_BUCKET_NAME not configured")
        if not namespace:
            raise ValueError("OCI_NAMESPACE not configured")
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{os.path.basename(file_path)}"
        object_name = f"{file_path}{unique_filename}"
        
        # Prepare upload parameters
        upload_kwargs = {
            'namespace_name': namespace,
            'bucket_name': bucket_name,
            'object_name': object_name,
            'file': file
        }
        
        # Add content type if provided
        if content_type:
            upload_kwargs['content_type'] = content_type
        
        # Upload the file
        response = self.client.put_object(**upload_kwargs)
        
        # Return public URL using default OCI Object Storage URL format
        region = current_app.config.get('OCI_REGION')
        return f"https://objectstorage.{region}.oraclecloud.com/n/{namespace}/b/{bucket_name}/o/{object_name}"
    
    def delete_file(self, file_url: str) -> bool:
        """Delete file from Oracle Object Storage"""
        try:
            return self._delete_from_oci(file_url)
        except Exception as e:
            current_app.logger.error(f"Failed to delete file {file_url}: {str(e)}")
            return False
    
    def _delete_from_oci(self, file_url: str) -> bool:
        """Delete file from Oracle Object Storage"""
        bucket_name = current_app.config.get('OCI_BUCKET_NAME')
        namespace = current_app.config.get('OCI_NAMESPACE')
        
        if not bucket_name or not namespace:
            return False
        
        # Extract object name from URL
        # URL format: https://objectstorage.region.oraclecloud.com/n/namespace/b/bucket/o/object_name
        try:
            if 'oraclecloud.com' in file_url:
                # Extract object name from full URL
                parts = file_url.split(f'/b/{bucket_name}/o/')
                if len(parts) > 1:
                    object_name = parts[1]
                else:
                    return False
            else:
                # Assume it's just the object name
                object_name = file_url
            
            # Delete the object
            self.client.delete_object(
                namespace_name=namespace,
                bucket_name=bucket_name,
                object_name=object_name
            )
            return True
            
        except ServiceError as e:
            if e.status == 404:
                # Object not found, consider it deleted
                return True
            current_app.logger.error(f"OCI ServiceError deleting {file_url}: {str(e)}")
            return False
        except Exception as e:
            current_app.logger.error(f"Error deleting {file_url}: {str(e)}")
            return False
    
    def get_file_url(self, file_path: str) -> str:
        """Get public URL for a file"""
        bucket_name = current_app.config.get('OCI_BUCKET_NAME')
        namespace = current_app.config.get('OCI_NAMESPACE')
        region = current_app.config.get('OCI_REGION')
        
        return f"https://objectstorage.{region}.oraclecloud.com/n/{namespace}/b/{bucket_name}/o/{file_path}"
    
    def list_files(self, prefix: str = None, limit: int = 100) -> list:
        """List files in the bucket with optional prefix"""
        bucket_name = current_app.config.get('OCI_BUCKET_NAME')
        namespace = current_app.config.get('OCI_NAMESPACE')
        
        if not bucket_name or not namespace:
            return []
        
        try:
            response = self.client.list_objects(
                namespace_name=namespace,
                bucket_name=bucket_name,
                prefix=prefix,
                limit=limit
            )
            
            files = []
            for obj in response.data.objects:
                files.append({
                    'name': obj.name,
                    'size': obj.size,
                    'etag': obj.etag,
                    'time_created': obj.time_created,
                    'url': self.get_file_url(obj.name)
                })
            
            return files
            
        except ServiceError as e:
            current_app.logger.error(f"Error listing files: {str(e)}")
            return []
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """Get file information from Oracle Object Storage"""
        bucket_name = current_app.config.get('OCI_BUCKET_NAME')
        namespace = current_app.config.get('OCI_NAMESPACE')
        
        if not bucket_name or not namespace:
            return None
        
        try:
            response = self.client.head_object(
                namespace_name=namespace,
                bucket_name=bucket_name,
                object_name=file_path
            )
            
            return {
                'name': file_path,
                'size': response.headers.get('content-length'),
                'content_type': response.headers.get('content-type'),
                'etag': response.headers.get('etag'),
                'last_modified': response.headers.get('last-modified'),
                'url': self.get_file_url(file_path)
            }
            
        except ServiceError as e:
            if e.status == 404:
                return None
            current_app.logger.error(f"Error getting file info for {file_path}: {str(e)}")
            return None

# Global instance
cloud_storage = CloudStorageService()
