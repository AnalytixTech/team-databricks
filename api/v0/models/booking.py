from datetime import datetime
from bson import ObjectId
from typing import Optional, Dict, Any, List
from enum import Enum
import re

class BookingStatus(Enum):
    """Booking status enumeration"""
    SOFT_RESERVE = "soft_reserve"  # Guest user reservation
    FIRM_RESERVE = "firm_reserve"  # Account holder reservation
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    OVERRIDDEN = "overridden"  # When soft reserve is overridden by firm reserve

class GuestInfo:
    """Guest user information for bookings"""
    
    def __init__(self, **kwargs):
        self.first_name = kwargs.get('first_name', '')
        self.last_name = kwargs.get('last_name', '')
        self.email = kwargs.get('email', '')
        self.phone = kwargs.get('phone', '')
        self.driver_license_number = kwargs.get('driver_license_number', '')
        self.driver_license_expiry = kwargs.get('driver_license_expiry')
        self.address = kwargs.get('address', {})
        self.emergency_contact = kwargs.get('emergency_contact', {})
    
    def validate(self) -> Dict[str, List[str]]:
        """Validate guest information"""
        errors = {}
        
        # Validate required fields
        if not self.first_name or len(self.first_name.strip()) < 2:
            errors['first_name'] = ['First name must be at least 2 characters']
        
        if not self.last_name or len(self.last_name.strip()) < 2:
            errors['last_name'] = ['Last name must be at least 2 characters']
        
        # Validate email
        if not self.email:
            errors['email'] = ['Email is required']
        elif not self._is_valid_email(self.email):
            errors['email'] = ['Invalid email format']
        
        # Validate phone
        if not self.phone:
            errors['phone'] = ['Phone number is required']
        elif not self._is_valid_phone(self.phone):
            errors['phone'] = ['Invalid phone number format']
        
        # Validate driver license
        if not self.driver_license_number:
            errors['driver_license_number'] = ['Driver license number is required']
        
        if not self.driver_license_expiry:
            errors['driver_license_expiry'] = ['Driver license expiry date is required']
        elif isinstance(self.driver_license_expiry, str):
            try:
                expiry_date = datetime.fromisoformat(self.driver_license_expiry)
                if expiry_date < datetime.utcnow():
                    errors['driver_license_expiry'] = ['Driver license has expired']
            except ValueError:
                errors['driver_license_expiry'] = ['Invalid date format']
        
        
        return errors
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def _is_valid_phone(self, phone: str) -> bool:
        """Validate phone number format"""
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        # Check if it's a valid length (7-15 digits)
        return 7 <= len(digits_only) <= 15

    
    def to_dict(self) -> Dict[str, Any]:
        """Convert guest info to dictionary"""
        return {
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'driver_license_number': self.driver_license_number,
            'driver_license_expiry': self.driver_license_expiry.isoformat() if isinstance(self.driver_license_expiry, datetime) else self.driver_license_expiry,
            'address': self.address,
            'emergency_contact': self.emergency_contact
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GuestInfo':
        """Create GuestInfo from dictionary"""
        # Convert string dates back to datetime objects
        if 'driver_license_expiry' in data and isinstance(data['driver_license_expiry'], str):
            data['driver_license_expiry'] = datetime.fromisoformat(data['driver_license_expiry'].replace('Z', '+00:00'))
        
        return cls(**data)

class Booking:
    """Booking model for the car rental application"""
    
    def __init__(self, **kwargs):
        self.id = kwargs.get('_id')
        self.user_id = kwargs.get('user_id')  # None for guest users
        self.guest_info = kwargs.get('guest_info')  # GuestInfo object for guest users
        self.car_id = kwargs.get('car_id')
        self.business_owner_id = kwargs.get('business_owner_id')
        self.start_date = kwargs.get('start_date')
        self.end_date = kwargs.get('end_date')
        self.pickup_location = kwargs.get('pickup_location', {})
        self.dropoff_location = kwargs.get('dropoff_location', {})
        self.status = kwargs.get('status', BookingStatus.SOFT_RESERVE.value)
        self.total_amount = kwargs.get('total_amount', 0.0)
        self.deposit_amount = kwargs.get('deposit_amount', 0.0)
        self.rental_fee = kwargs.get('rental_fee', 0.0)
        self.payment_status = kwargs.get('payment_status', 'pending')
        self.payment_reference = kwargs.get('payment_reference')
        self.special_requests = kwargs.get('special_requests', '')
        self.driver_license_verified = kwargs.get('driver_license_verified', False)
        self.insurance_info = kwargs.get('insurance_info', {})
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())
        self.cancelled_at = kwargs.get('cancelled_at')
        self.cancellation_reason = kwargs.get('cancellation_reason')
        
        # Convert guest_info dict to GuestInfo object if needed
        if self.guest_info and isinstance(self.guest_info, dict):
            self.guest_info = GuestInfo.from_dict(self.guest_info)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert booking to dictionary"""
        return {
            'id': str(self.id) if self.id else None,
            'user_id': str(self.user_id) if self.user_id else None,
            'guest_info': self.guest_info.to_dict() if self.guest_info else None,
            'car_id': str(self.car_id) if self.car_id else None,
            'business_owner_id': str(self.business_owner_id) if self.business_owner_id else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'pickup_location': self.pickup_location,
            'dropoff_location': self.dropoff_location,
            'status': self.status,
            'total_amount': self.total_amount,
            'deposit_amount': self.deposit_amount,
            'rental_fee': self.rental_fee,
            'payment_status': self.payment_status,
            'payment_reference': self.payment_reference,
            'special_requests': self.special_requests,
            'driver_license_verified': self.driver_license_verified,
            'insurance_info': self.insurance_info,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancellation_reason': self.cancellation_reason
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Booking':
        """Create Booking instance from dictionary"""
        # Convert string dates back to datetime objects
        if 'start_date' in data and isinstance(data['start_date'], str):
            data['start_date'] = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        if 'end_date' in data and isinstance(data['end_date'], str):
            data['end_date'] = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
        if 'cancelled_at' in data and isinstance(data['cancelled_at'], str):
            data['cancelled_at'] = datetime.fromisoformat(data['cancelled_at'].replace('Z', '+00:00'))
        
        return cls(**data)
    
    def save(self, db) -> str:
        """Save booking to database"""
        collection = db.get_collection('bookings')
        booking_data = self.to_dict()
        
        if self.id:
            # Update existing booking
            booking_data['updated_at'] = datetime.utcnow()
            collection.update_one(
                {'_id': ObjectId(self.id)},
                {'$set': booking_data}
            )
        else:
            # Create new booking
            booking_data['created_at'] = datetime.utcnow()
            booking_data['updated_at'] = datetime.utcnow()
            result = collection.insert_one(booking_data)
            self.id = str(result.inserted_id)
        
        return str(self.id)
    
    @classmethod
    def find_by_id(cls, db, booking_id: str) -> Optional['Booking']:
        """Find booking by ID"""
        collection = db.get_collection('bookings')
        booking_data = collection.find_one({'_id': ObjectId(booking_id)})
        if booking_data:
            booking_data['_id'] = str(booking_data['_id'])
            return cls.from_dict(booking_data)
        return None
    
    @classmethod
    def find_by_user(cls, db, user_id: str, skip=0, limit=20) -> List['Booking']:
        """Find bookings by user ID"""
        collection = db.get_collection('bookings')
        cursor = collection.find(
            {'user_id': ObjectId(user_id)},
            skip=skip,
            limit=limit
        ).sort('created_at', -1)
        
        bookings = []
        for booking_data in cursor:
            booking_data['_id'] = str(booking_data['_id'])
            bookings.append(cls.from_dict(booking_data))
        return bookings
    
    @classmethod
    def find_by_business_owner(cls, db, business_owner_id: str, skip=0, limit=20) -> List['Booking']:
        """Find bookings by business owner ID"""
        collection = db.get_collection('bookings')
        cursor = collection.find(
            {'business_owner_id': ObjectId(business_owner_id)},
            skip=skip,
            limit=limit
        ).sort('created_at', -1)
        
        bookings = []
        for booking_data in cursor:
            booking_data['_id'] = str(booking_data['_id'])
            bookings.append(cls.from_dict(booking_data))
        return bookings
    
    @classmethod
    def find_by_guest_email(cls, db, email: str, skip=0, limit=20) -> List['Booking']:
        """Find bookings by guest email"""
        collection = db.get_collection('bookings')
        cursor = collection.find(
            {'guest_info.email': email},
            skip=skip,
            limit=limit
        ).sort('created_at', -1)
        
        bookings = []
        for booking_data in cursor:
            booking_data['_id'] = str(booking_data['_id'])
            bookings.append(cls.from_dict(booking_data))
        return bookings
    
    @classmethod
    def find_by_guest_phone(cls, db, phone: str, skip=0, limit=20) -> List['Booking']:
        """Find bookings by guest phone number"""
        collection = db.get_collection('bookings')
        cursor = collection.find(
            {'guest_info.phone': phone},
            skip=skip,
            limit=limit
        ).sort('created_at', -1)
        
        bookings = []
        for booking_data in cursor:
            booking_data['_id'] = str(booking_data['_id'])
            bookings.append(cls.from_dict(booking_data))
        return bookings
    
    @classmethod
    def find_by_car_and_dates(cls, db, car_id: str, start_date: datetime, end_date: datetime) -> List['Booking']:
        """Find bookings for a car within a date range"""
        collection = db.get_collection('bookings')
        
        # Find bookings that overlap with the given date range
        query = {
            'car_id': ObjectId(car_id),
            'status': {'$in': [BookingStatus.SOFT_RESERVE.value, BookingStatus.FIRM_RESERVE.value, BookingStatus.CONFIRMED.value]},
            '$or': [
                # Booking starts within the range
                {'start_date': {'$gte': start_date, '$lte': end_date}},
                # Booking ends within the range
                {'end_date': {'$gte': start_date, '$lte': end_date}},
                # Booking encompasses the range
                {'start_date': {'$lte': start_date}, 'end_date': {'$gte': end_date}}
            ]
        }
        
        cursor = collection.find(query).sort('created_at', 1)
        
        bookings = []
        for booking_data in cursor:
            booking_data['_id'] = str(booking_data['_id'])
            bookings.append(cls.from_dict(booking_data))
        return bookings
    
    @classmethod
    def find_conflicting_bookings(cls, db, car_id: str, start_date: datetime, end_date: datetime, exclude_booking_id: str = None) -> List['Booking']:
        """Find bookings that conflict with the given date range"""
        collection = db.get_collection('bookings')
        
        query = {
            'car_id': ObjectId(car_id),
            'status': {'$in': [BookingStatus.SOFT_RESERVE.value, BookingStatus.FIRM_RESERVE.value, BookingStatus.CONFIRMED.value]},
            '$or': [
                # Booking starts within the range
                {'start_date': {'$gte': start_date, '$lte': end_date}},
                # Booking ends within the range
                {'end_date': {'$gte': start_date, '$lte': end_date}},
                # Booking encompasses the range
                {'start_date': {'$lte': start_date}, 'end_date': {'$gte': end_date}}
            ]
        }
        
        if exclude_booking_id:
            query['_id'] = {'$ne': ObjectId(exclude_booking_id)}
        
        cursor = collection.find(query).sort('created_at', 1)
        
        bookings = []
        for booking_data in cursor:
            booking_data['_id'] = str(booking_data['_id'])
            bookings.append(cls.from_dict(booking_data))
        return bookings
    
    def update_status(self, db, status: str, reason: str = None):
        """Update booking status"""
        collection = db.get_collection('bookings')
        
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        
        if status == BookingStatus.CANCELLED.value:
            update_data['cancelled_at'] = datetime.utcnow()
            if reason:
                update_data['cancellation_reason'] = reason
        
        collection.update_one(
            {'_id': ObjectId(self.id)},
            {'$set': update_data}
        )
        
        self.status = status
        self.updated_at = datetime.utcnow()
        if status == BookingStatus.CANCELLED.value:
            self.cancelled_at = datetime.utcnow()
            if reason:
                self.cancellation_reason = reason
    
    def override_soft_reserves(self, db):
        """Override soft reserves for the same car and date range"""
        collection = db.get_collection('bookings')
        
        # Find and update conflicting soft reserves
        result = collection.update_many(
            {
                'car_id': ObjectId(self.car_id),
                'status': BookingStatus.SOFT_RESERVE.value,
                '$or': [
                    {'start_date': {'$gte': self.start_date, '$lte': self.end_date}},
                    {'end_date': {'$gte': self.start_date, '$lte': self.end_date}},
                    {'start_date': {'$lte': self.start_date}, 'end_date': {'$gte': self.end_date}}
                ]
            },
            {
                '$set': {
                    'status': BookingStatus.OVERRIDDEN.value,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return result.modified_count
    
    def calculate_total_amount(self, rental_price_per_day: float, deposit_percentage: float = 0.2):
        """Calculate total amount, deposit, and rental fee"""
        if not self.start_date or not self.end_date:
            return
        
        # Calculate number of days
        days = (self.end_date - self.start_date).days + 1
        
        # Calculate amounts
        self.rental_fee = rental_price_per_day * days
        self.deposit_amount = self.rental_fee * deposit_percentage
        self.total_amount = self.rental_fee + self.deposit_amount
    
    def is_guest_booking(self) -> bool:
        """Check if this is a guest booking"""
        return self.user_id is None and bool(self.guest_info)
    
    def set_guest_info(self, guest_data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Set guest information and validate it"""
        self.guest_info = GuestInfo.from_dict(guest_data)
        errors = self.guest_info.validate()
        
        if not errors:
            self.updated_at = datetime.utcnow()
        
        return errors
    
    def get_guest_email(self) -> Optional[str]:
        """Get guest email if this is a guest booking"""
        if self.is_guest_booking() and self.guest_info:
            return self.guest_info.email
        return None
    
    def get_guest_contact_info(self) -> Dict[str, str]:
        """Get guest contact information"""
        if self.is_guest_booking() and self.guest_info:
            return {
                'email': self.guest_info.email,
                'phone': self.guest_info.phone,
                'name': f"{self.guest_info.first_name} {self.guest_info.last_name}"
            }
        return {}
    
    def validate_guest_booking(self) -> Dict[str, List[str]]:
        """Validate guest booking requirements"""
        errors = {}
        
        if self.is_guest_booking():
            if not self.guest_info:
                errors['guest_info'] = ['Guest information is required for guest bookings']
            else:
                guest_errors = self.guest_info.validate()
                if guest_errors:
                    errors.update(guest_errors)
        
        return errors
    
    def delete(self, db) -> bool:
        """Delete booking from database"""
        if not self.id:
            return False
        
        collection = db.get_collection('bookings')
        result = collection.delete_one({'_id': ObjectId(self.id)})
        return result.deleted_count > 0
