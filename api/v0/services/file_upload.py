import os
from typing import Optional, Dict, Any
from werkzeug.datastructures import FileStorage
from PIL import Image
from flask import current_app
from .cloud_storage import cloud_storage

class FileUploadService:
    """Service for handling file uploads with validation and cloud storage"""
    
    def __init__(self):
        self.allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'pdf'})
        self.max_file_size = current_app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)
    
    def validate_file(self, file: FileStorage) -> Dict[str, Any]:
        """Validate uploaded file"""
        errors = []
        
        if not file or not file.filename:
            errors.append("No file provided")
            return {'valid': False, 'errors': errors}
        
        # Check file extension
        if not self._allowed_file(file.filename):
            errors.append(f"File type not allowed. Allowed types: {', '.join(self.allowed_extensions)}")
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > self.max_file_size:
            errors.append(f"File too large. Maximum size: {self.max_file_size / (1024*1024):.1f}MB")
        
        # Check if file is empty
        if file_size == 0:
            errors.append("File is empty")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'file_size': file_size
        }
    
    def _allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def upload_car_image(self, file: FileStorage, car_id: str) -> Optional[str]:
        """Upload car image to cloud storage"""
        validation = self.validate_file(file)
        if not validation['valid']:
            current_app.logger.error(f"Car image validation failed: {validation['errors']}")
            return None
        
        # Process image if it's an image file
        if self._is_image_file(file.filename):
            processed_file = self._process_image(file)
            if not processed_file:
                return None
        else:
            processed_file = file
        
        # Upload to cloud storage
        file_path = current_app.config.get('CAR_IMAGES_PATH', 'car-images/')
        content_type = self._get_content_type(file.filename)
        
        return cloud_storage.upload_file(processed_file, file_path, content_type)
    
    def upload_driver_license(self, file: FileStorage, user_id: str) -> Optional[str]:
        """Upload driver license document to cloud storage"""
        validation = self.validate_file(file)
        if not validation['valid']:
            current_app.logger.error(f"Driver license validation failed: {validation['errors']}")
            return None
        
        # Upload to cloud storage
        file_path = current_app.config.get('DRIVER_LICENSE_PATH', 'driver-licenses/')
        content_type = self._get_content_type(file.filename)
        
        return cloud_storage.upload_file(file, file_path, content_type)
    
    def upload_profile_image(self, file: FileStorage, user_id: str) -> Optional[str]:
        """Upload profile image to cloud storage"""
        validation = self.validate_file(file)
        if not validation['valid']:
            current_app.logger.error(f"Profile image validation failed: {validation['errors']}")
            return None
        
        # Process image
        if self._is_image_file(file.filename):
            processed_file = self._process_image(file, max_size=(500, 500))
            if not processed_file:
                return None
        else:
            processed_file = file
        
        # Upload to cloud storage
        file_path = current_app.config.get('PROFILE_IMAGES_PATH', 'profile-images/')
        content_type = self._get_content_type(file.filename)
        
        return cloud_storage.upload_file(processed_file, file_path, content_type)
    
    def _is_image_file(self, filename: str) -> bool:
        """Check if file is an image"""
        image_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in image_extensions
    
    def _process_image(self, file: FileStorage, max_size: tuple = (1200, 1200), quality: int = 85) -> Optional[FileStorage]:
        """Process and optimize image"""
        try:
            # Open image with PIL
            image = Image.open(file)
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            
            # Resize if necessary
            if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Create new file object
            from io import BytesIO
            processed_file = BytesIO()
            image.save(processed_file, format='JPEG', quality=quality, optimize=True)
            processed_file.seek(0)
            
            # Create FileStorage-like object
            from werkzeug.datastructures import FileStorage
            return FileStorage(
                stream=processed_file,
                filename=file.filename,
                content_type='image/jpeg'
            )
            
        except Exception as e:
            current_app.logger.error(f"Image processing failed: {str(e)}")
            return None
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension"""
        extension = filename.rsplit('.', 1)[1].lower()
        content_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'pdf': 'application/pdf'
        }
        return content_types.get(extension, 'application/octet-stream')
    
    def delete_file(self, file_url: str) -> bool:
        """Delete file from cloud storage"""
        return cloud_storage.delete_file(file_url)

# Global instance
file_upload_service = FileUploadService()
