from datetime import datetime
from bson import ObjectId
from typing import Optional, Dict, Any, List, BinaryIO
from enum import Enum
from flask import current_app
from services.file_upload import file_upload_service
from services.cloud_storage import cloud_storage

class CarType(Enum):
    """Car type enumeration"""
    SEDAN = "sedan"
    SUV = "suv"
    HATCHBACK = "hatchback"
    COUPE = "coupe"
    CONVERTIBLE = "convertible"
    WAGON = "wagon"
    PICKUP = "pickup"
    VAN = "van"

class AvailabilityStatus(Enum):
    """Car availability status"""
    AVAILABLE = "available"
    RENTED = "rented"
    MAINTENANCE = "maintenance"
    UNAVAILABLE = "unavailable"

class Car:
    """Car model for the car rental application"""
    
    def __init__(self, **kwargs):
        self.id = kwargs.get('_id')
        self.business_owner_id = kwargs.get('business_owner_id')
        self.make = kwargs.get('make')
        self.model = kwargs.get('model')
        self.year = kwargs.get('year')
        self.type = kwargs.get('type')
        self.color = kwargs.get('color')
        self.license_plate = kwargs.get('license_plate')
        self.vin = kwargs.get('vin')
        self.rental_price_per_day = kwargs.get('rental_price_per_day', 0.0)
        self.deposit_amount = kwargs.get('deposit_amount', 0.0)
        self.pictures = kwargs.get('pictures', [])
        self.features = kwargs.get('features', [])
        self.location = kwargs.get('location', {})
        self.availability_status = kwargs.get('availability_status', AvailabilityStatus.AVAILABLE.value)
        self.mileage = kwargs.get('mileage', 0)
        self.fuel_type = kwargs.get('fuel_type')
        self.transmission = kwargs.get('transmission')
        self.seating_capacity = kwargs.get('seating_capacity')
        self.description = kwargs.get('description')
        self.is_active = kwargs.get('is_active', True)
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert car to dictionary"""
        return {
            'id': str(self.id) if self.id else None,
            'business_owner_id': str(self.business_owner_id) if self.business_owner_id else None,
            'make': self.make,
            'model': self.model,
            'year': self.year,
            'type': self.type,
            'color': self.color,
            'license_plate': self.license_plate,
            'vin': self.vin,
            'rental_price_per_day': self.rental_price_per_day,
            'deposit_amount': self.deposit_amount,
            'pictures': self.pictures,
            'features': self.features,
            'location': self.location,
            'availability_status': self.availability_status,
            'mileage': self.mileage,
            'fuel_type': self.fuel_type,
            'transmission': self.transmission,
            'seating_capacity': self.seating_capacity,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Car':
        """Create Car instance from dictionary"""
        # Convert string dates back to datetime objects
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
        
        return cls(**data)
    
    def save(self, db) -> str:
        """Save car to database"""
        collection = db.get_collection('cars')
        car_data = self.to_dict()
        
        if self.id:
            # Update existing car
            car_data['updated_at'] = datetime.utcnow()
            collection.update_one(
                {'_id': ObjectId(self.id)},
                {'$set': car_data}
            )
        else:
            # Create new car
            car_data['created_at'] = datetime.utcnow()
            car_data['updated_at'] = datetime.utcnow()
            result = collection.insert_one(car_data)
            self.id = str(result.inserted_id)
        
        return str(self.id)
    
    @classmethod
    def find_by_id(cls, db, car_id: str) -> Optional['Car']:
        """Find car by ID"""
        collection = db.get_collection('cars')
        car_data = collection.find_one({'_id': ObjectId(car_id)})
        if car_data:
            car_data['_id'] = str(car_data['_id'])
            return cls.from_dict(car_data)
        return None
    
    @classmethod
    def find_by_business_owner(cls, db, business_owner_id: str, skip=0, limit=20) -> List['Car']:
        """Find cars by business owner"""
        collection = db.get_collection('cars')
        cursor = collection.find(
            {'business_owner_id': ObjectId(business_owner_id), 'is_active': True},
            skip=skip,
            limit=limit
        ).sort('created_at', -1)
        
        cars = []
        for car_data in cursor:
            car_data['_id'] = str(car_data['_id'])
            cars.append(cls.from_dict(car_data))
        return cars
    
    @classmethod
    def find_available_cars(cls, db, skip=0, limit=20, filters=None) -> List['Car']:
        """Find available cars with optional filters"""
        collection = db.get_collection('cars')
        
        # Base query for available cars
        query = {
            'availability_status': AvailabilityStatus.AVAILABLE.value,
            'is_active': True
        }
        
        # Apply filters
        if filters:
            if 'type' in filters:
                query['type'] = filters['type']
            if 'make' in filters:
                query['make'] = {'$regex': filters['make'], '$options': 'i'}
            if 'model' in filters:
                query['model'] = {'$regex': filters['model'], '$options': 'i'}
            if 'min_price' in filters:
                query['rental_price_per_day'] = {'$gte': filters['min_price']}
            if 'max_price' in filters:
                if 'rental_price_per_day' in query:
                    query['rental_price_per_day']['$lte'] = filters['max_price']
                else:
                    query['rental_price_per_day'] = {'$lte': filters['max_price']}
            if 'location' in filters:
                query['location.city'] = {'$regex': filters['location'], '$options': 'i'}
        
        # Sort options
        sort_option = [('created_at', -1)]
        if filters and 'sort_by' in filters:
            if filters['sort_by'] == 'price_low':
                sort_option = [('rental_price_per_day', 1)]
            elif filters['sort_by'] == 'price_high':
                sort_option = [('rental_price_per_day', -1)]
            elif filters['sort_by'] == 'year':
                sort_option = [('year', -1)]
        
        cursor = collection.find(query, skip=skip, limit=limit).sort(sort_option)
        
        cars = []
        for car_data in cursor:
            car_data['_id'] = str(car_data['_id'])
            cars.append(cls.from_dict(car_data))
        return cars
    
    @classmethod
    def search_cars(cls, db, search_term: str, skip=0, limit=20) -> List['Car']:
        """Search cars by make, model, or description"""
        collection = db.get_collection('cars')
        
        query = {
            'availability_status': AvailabilityStatus.AVAILABLE.value,
            'is_active': True,
            '$or': [
                {'make': {'$regex': search_term, '$options': 'i'}},
                {'model': {'$regex': search_term, '$options': 'i'}},
                {'description': {'$regex': search_term, '$options': 'i'}}
            ]
        }
        
        cursor = collection.find(query, skip=skip, limit=limit).sort('created_at', -1)
        
        cars = []
        for car_data in cursor:
            car_data['_id'] = str(car_data['_id'])
            cars.append(cls.from_dict(car_data))
        return cars
    
    def update_availability(self, db, status: str):
        """Update car availability status"""
        collection = db.get_collection('cars')
        collection.update_one(
            {'_id': ObjectId(self.id)},
            {
                '$set': {
                    'availability_status': status,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        self.availability_status = status
        self.updated_at = datetime.utcnow()
    
    def add_picture(self, db, picture_url: str):
        """Add picture URL to car"""
        collection = db.get_collection('cars')
        collection.update_one(
            {'_id': ObjectId(self.id)},
            {
                '$push': {'pictures': picture_url},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        self.pictures.append(picture_url)
        self.updated_at = datetime.utcnow()
    
    def upload_picture(self, db, file: BinaryIO, filename: str) -> Optional[str]:
        """Upload car picture to cloud storage and add to car"""
        if not self.id:
            raise ValueError("Car must be saved before uploading pictures")
        
        # Upload file to cloud storage
        picture_url = file_upload_service.upload_car_image(file, filename)
        
        if picture_url:
            # Add picture URL to car
            self.add_picture(db, picture_url)
            return picture_url
        
        return None
    
    def upload_multiple_pictures(self, db, files: List[tuple]) -> List[str]:
        """Upload multiple car pictures to cloud storage
        
        Args:
            files: List of tuples (file, filename)
        
        Returns:
            List of uploaded picture URLs
        """
        if not self.id:
            raise ValueError("Car must be saved before uploading pictures")
        
        uploaded_urls = []
        
        for file, filename in files:
            picture_url = self.upload_picture(db, file, filename)
            if picture_url:
                uploaded_urls.append(picture_url)
        
        return uploaded_urls
    
    def remove_picture(self, db, picture_url: str) -> bool:
        """Remove picture from car and delete from cloud storage"""
        if not self.id:
            return False
        
        # Remove from database
        collection = db.get_collection('cars')
        result = collection.update_one(
            {'_id': ObjectId(self.id)},
            {
                '$pull': {'pictures': picture_url},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        if result.modified_count > 0:
            # Remove from local list
            if picture_url in self.pictures:
                self.pictures.remove(picture_url)
            
            # Delete from cloud storage
            try:
                cloud_storage.delete_file(picture_url)
            except Exception as e:
                current_app.logger.error(f"Failed to delete picture from cloud storage: {str(e)}")
            
            self.updated_at = datetime.utcnow()
            return True
        
        return False
    
    def replace_picture(self, db, old_picture_url: str, new_file: BinaryIO, new_filename: str) -> Optional[str]:
        """Replace an existing picture with a new one"""
        if not self.id:
            raise ValueError("Car must be saved before replacing pictures")
        
        # Upload new picture
        new_picture_url = file_upload_service.upload_car_image(new_file, new_filename)
        
        if new_picture_url:
            # Update in database
            collection = db.get_collection('cars')
            result = collection.update_one(
                {'_id': ObjectId(self.id)},
                {
                    '$pull': {'pictures': old_picture_url},
                    '$push': {'pictures': new_picture_url},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            
            if result.modified_count > 0:
                # Update local list
                if old_picture_url in self.pictures:
                    self.pictures.remove(old_picture_url)
                self.pictures.append(new_picture_url)
                
                # Delete old picture from cloud storage
                try:
                    cloud_storage.delete_file(old_picture_url)
                except Exception as e:
                    current_app.logger.error(f"Failed to delete old picture from cloud storage: {str(e)}")
                
                self.updated_at = datetime.utcnow()
                return new_picture_url
        
        return None
    
    def get_picture_urls(self) -> List[str]:
        """Get all picture URLs for this car"""
        return self.pictures.copy()
    
    def get_primary_picture(self) -> Optional[str]:
        """Get the primary (first) picture URL for this car"""
        return self.pictures[0] if self.pictures else None
    
    def get_picture_count(self) -> int:
        """Get the number of pictures for this car"""
        return len(self.pictures)
    
    def has_pictures(self) -> bool:
        """Check if car has any pictures"""
        return len(self.pictures) > 0
    
    def to_dict_with_pictures(self) -> Dict[str, Any]:
        """Convert car to dictionary with picture information"""
        car_dict = self.to_dict()
        car_dict.update({
            'picture_count': self.get_picture_count(),
            'has_pictures': self.has_pictures(),
            'primary_picture': self.get_primary_picture()
        })
        return car_dict
    
    def validate_picture_upload(self, file: BinaryIO, filename: str) -> Dict[str, List[str]]:
        """Validate picture file before upload"""
        errors = {}
        
        # Check if file is provided
        if not file:
            errors['file'] = ['No file provided']
            return errors
        
        # Check filename
        if not filename:
            errors['filename'] = ['No filename provided']
            return errors
        
        # Check file extension
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif'})
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            errors['filename'] = [f'Invalid file type. Allowed types: {", ".join(allowed_extensions)}']
        
        # Check file size
        max_size = current_app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)  # 16MB default
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > max_size:
            errors['file_size'] = [f'File size exceeds maximum allowed size of {max_size / (1024 * 1024):.1f}MB']
        
        return errors
    
    def delete(self, db) -> bool:
        """Delete car from database and clean up pictures from cloud storage"""
        if not self.id:
            return False
        
        # Delete all pictures from cloud storage
        for picture_url in self.pictures:
            try:
                cloud_storage.delete_file(picture_url)
            except Exception as e:
                current_app.logger.error(f"Failed to delete picture {picture_url} from cloud storage: {str(e)}")
        
        # Delete car from database
        collection = db.get_collection('cars')
        result = collection.delete_one({'_id': ObjectId(self.id)})
        return result.deleted_count > 0
    
    def soft_delete(self, db) -> bool:
        """Soft delete car (mark as inactive)"""
        if not self.id:
            return False
        
        collection = db.get_collection('cars')
        result = collection.update_one(
            {'_id': ObjectId(self.id)},
            {
                '$set': {
                    'is_active': False,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        self.is_active = False
        self.updated_at = datetime.utcnow()
        return result.modified_count > 0
    
    def reorder_pictures(self, db, picture_urls: List[str]) -> bool:
        """Reorder car pictures"""
        if not self.id:
            return False
        
        # Validate that all provided URLs exist in current pictures
        if not all(url in self.pictures for url in picture_urls):
            return False
        
        # Update in database
        collection = db.get_collection('cars')
        result = collection.update_one(
            {'_id': ObjectId(self.id)},
            {
                '$set': {
                    'pictures': picture_urls,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            self.pictures = picture_urls
            self.updated_at = datetime.utcnow()
            return True
        
        return False
    
    @classmethod
    def cleanup_orphaned_pictures(cls, db) -> int:
        """Clean up pictures in cloud storage that are not referenced by any car"""
        collection = db.get_collection('cars')
        
        # Get all picture URLs from all cars
        all_pictures = set()
        cursor = collection.find({}, {'pictures': 1})
        for car_data in cursor:
            if 'pictures' in car_data:
                all_pictures.update(car_data['pictures'])
        
        # Get all files in car-images/ directory from cloud storage
        try:
            cloud_files = cloud_storage.list_files(prefix=current_app.config.get('CAR_IMAGES_PATH', 'car-images/'))
            cloud_file_urls = {file_info['url'] for file_info in cloud_files}
            
            # Find orphaned files
            orphaned_urls = cloud_file_urls - all_pictures
            
            # Delete orphaned files
            deleted_count = 0
            for url in orphaned_urls:
                try:
                    if cloud_storage.delete_file(url):
                        deleted_count += 1
                        current_app.logger.info(f"Deleted orphaned picture: {url}")
                except Exception as e:
                    current_app.logger.error(f"Failed to delete orphaned picture {url}: {str(e)}")
            
            return deleted_count
            
        except Exception as e:
            current_app.logger.error(f"Failed to cleanup orphaned pictures: {str(e)}")
            return 0
