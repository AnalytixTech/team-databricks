from flask import current_app
from api.v0.database import db
from .cloud_storage import cloud_storage

class HealthCheckService:
    """Service for performing health checks on various components"""
    
    @staticmethod
    def check_database():
        """Check database connectivity"""
        try:
            db.client.admin.command('ping')
            return {'status': 'connected', 'error': None}
        except Exception as e:
            return {'status': 'disconnected', 'error': str(e)}
    
    @staticmethod
    def check_cloud_storage():
        """Check Oracle Object Storage connectivity"""
        try:
            # Test OCI client initialization
            client = cloud_storage.client
            
            # Get configuration
            bucket_name = current_app.config.get('OCI_BUCKET_NAME')
            namespace = current_app.config.get('OCI_NAMESPACE')
            
            if not bucket_name or not namespace:
                return {
                    'status': 'not_configured',
                    'error': 'OCI_BUCKET_NAME and OCI_NAMESPACE must be configured'
                }
            
            # Test bucket access by listing objects (limit to 1 for efficiency)
            response = client.list_objects(
                namespace_name=namespace,
                bucket_name=bucket_name,
                limit=1
            )
            
            return {'status': 'connected', 'error': None}
            
        except Exception as e:
            return {'status': 'disconnected', 'error': str(e)}
    
    @staticmethod
    def get_overall_health():
        """Get overall system health status"""
        health_status = {
            'status': 'healthy',
            'services': {},
            'models': ['User', 'Car', 'Booking', 'Payment'],
            'version': '1.0.0'
        }
        
        # Check database
        db_health = HealthCheckService.check_database()
        health_status['services']['database'] = db_health['status']
        if db_health['error']:
            health_status['services']['database'] = f"disconnected: {db_health['error']}"
            health_status['status'] = 'unhealthy'
        
        # Check cloud storage
        storage_health = HealthCheckService.check_cloud_storage()
        health_status['services']['cloud_storage'] = storage_health['status']
        if storage_health['error']:
            health_status['services']['cloud_storage'] = f"disconnected: {storage_health['error']}"
            health_status['status'] = 'unhealthy'
        
        return health_status
    
    @staticmethod
    def get_cloud_storage_details():
        """Get detailed cloud storage information"""
        try:
            # Test OCI client initialization
            client = cloud_storage.client
            
            # Get configuration
            bucket_name = current_app.config.get('OCI_BUCKET_NAME')
            namespace = current_app.config.get('OCI_NAMESPACE')
            region = current_app.config.get('OCI_REGION')
            
            if not bucket_name or not namespace:
                return {
                    'status': 'not_configured',
                    'error': 'OCI_BUCKET_NAME and OCI_NAMESPACE must be configured',
                    'config': {
                        'bucket_name': bucket_name,
                        'namespace': namespace,
                        'region': region
                    }
                }
            
            # Test bucket access
            response = client.list_objects(
                namespace_name=namespace,
                bucket_name=bucket_name,
                limit=1
            )
            
            # Get bucket info
            bucket_info = client.get_bucket(
                namespace_name=namespace,
                bucket_name=bucket_name
            )
            
            return {
                'status': 'healthy',
                'service': 'Oracle Object Storage',
                'bucket': {
                    'name': bucket_name,
                    'namespace': namespace,
                    'region': region,
                    'created': bucket_info.data.time_created.isoformat() if bucket_info.data.time_created else None,
                    'etag': bucket_info.data.etag
                },
                'access': 'verified',
                'object_count': len(response.data.objects) if response.data.objects else 0
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'service': 'Oracle Object Storage',
                'error': str(e),
                'config': {
                    'bucket_name': current_app.config.get('OCI_BUCKET_NAME'),
                    'namespace': current_app.config.get('OCI_NAMESPACE'),
                    'region': current_app.config.get('OCI_REGION')
                }
            }

# Global instance
health_check_service = HealthCheckService()
