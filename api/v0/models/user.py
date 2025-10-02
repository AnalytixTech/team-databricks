from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional, Dict, Any, List
from enum import Enum
import bcrypt
import secrets

class UserRole(Enum):
    """User role enumeration"""
    CUSTOMER = "customer"
    BUSINESS_OWNER = "business_owner"

class User:
    """User model for the car rental application"""
    
    def __init__(self, **kwargs):
        self.id = kwargs.get('_id')
        self.email = kwargs.get('email')
        self.phone = kwargs.get('phone')
        self.password_hash = kwargs.get('password_hash')
        self.first_name = kwargs.get('first_name')
        self.last_name = kwargs.get('last_name')
        self.role = kwargs.get('role')
        if not self.role:
            raise ValueError("Role is required and must be explicitly specified")
        if self.role not in [role.value for role in UserRole]:
            raise ValueError(f"Invalid role: {self.role}. Must be one of: {[role.value for role in UserRole]}")
        self.business_name = kwargs.get('business_name')  # Required for business owners
        
        # Validate business name for business owners
        if self.role == UserRole.BUSINESS_OWNER.value:
            if not self.business_name or len(self.business_name.strip()) < 2:
                raise ValueError("Business name is required for business owners and must be at least 2 characters long")
        self.driver_license = kwargs.get('driver_license', {})
        self.payment_methods = kwargs.get('payment_methods', [])
        self.is_active = kwargs.get('is_active', True)
        self.is_verified = kwargs.get('is_verified', False)
        self.verification_token = kwargs.get('verification_token')
        self.verification_token_expires = kwargs.get('verification_token_expires')
        self.password_reset_token = kwargs.get('password_reset_token')
        self.password_reset_token_expires = kwargs.get('password_reset_token_expires')
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())
        self.last_login = kwargs.get('last_login')
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        if not password:
            raise ValueError("Password cannot be empty")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """Check if provided password matches the hash"""
        if not self.password_hash:
            return False
        if not password:
            return False
        
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        except (ValueError, TypeError):
            return False
    
    def set_password(self, password: str):
        """Set password hash"""
        self.password_hash = self.hash_password(password)
        self.updated_at = datetime.utcnow()
    
    def change_password(self, old_password: str, new_password: str) -> bool:
        """Change password with old password verification"""
        if not self.check_password(old_password):
            return False
        
        self.set_password(new_password)
        return True
    
    @staticmethod
    def generate_verification_token() -> str:
        """Generate a secure verification token"""
        return secrets.token_urlsafe(32)
    
    def generate_email_verification_token(self) -> str:
        """Generate email verification token"""
        self.verification_token = self.generate_verification_token()
        self.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        self.updated_at = datetime.utcnow()
        return self.verification_token
    
    def generate_password_reset_token(self) -> str:
        """Generate password reset token"""
        self.password_reset_token = self.generate_verification_token()
        self.password_reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        self.updated_at = datetime.utcnow()
        return self.password_reset_token
    
    def verify_email_token(self, token: str) -> bool:
        """Verify email verification token"""
        if not self.verification_token or not self.verification_token_expires:
            return False
        
        if self.verification_token != token:
            return False
        
        if datetime.utcnow() > self.verification_token_expires:
            return False
        
        # Mark as verified and clear token
        self.is_verified = True
        self.verification_token = None
        self.verification_token_expires = None
        self.updated_at = datetime.utcnow()
        return True
    
    def verify_password_reset_token(self, token: str) -> bool:
        """Verify password reset token"""
        if not self.password_reset_token or not self.password_reset_token_expires:
            return False
        
        if self.password_reset_token != token:
            return False
        
        if datetime.utcnow() > self.password_reset_token_expires:
            return False
        
        return True
    
    def reset_password_with_token(self, token: str, new_password: str) -> bool:
        """Reset password using token"""
        if not self.verify_password_reset_token(token):
            return False
        
        self.set_password(new_password)
        self.password_reset_token = None
        self.password_reset_token_expires = None
        self.updated_at = datetime.utcnow()
        return True
    
    def clear_verification_tokens(self):
        """Clear all verification tokens"""
        self.verification_token = None
        self.verification_token_expires = None
        self.password_reset_token = None
        self.password_reset_token_expires = None
        self.updated_at = datetime.utcnow()
    
    def set_driver_license(self, license_data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Set and validate driver license information"""
        errors = {}
        
        # Validate required fields
        if not license_data.get('number'):
            errors['number'] = ['Driver license number is required']
        
        if not license_data.get('expiry_date'):
            errors['expiry_date'] = ['Driver license expiry date is required']
        else:
            try:
                if isinstance(license_data['expiry_date'], str):
                    expiry_date = datetime.fromisoformat(license_data['expiry_date'].replace('Z', '+00:00'))
                else:
                    expiry_date = license_data['expiry_date']
                
                if expiry_date < datetime.utcnow():
                    errors['expiry_date'] = ['Driver license has expired']
            except ValueError:
                errors['expiry_date'] = ['Invalid date format']
        
        if not errors:
            self.driver_license = license_data
            self.updated_at = datetime.utcnow()
        
        return errors
    
    def validate_driver_license(self) -> Dict[str, List[str]]:
        """Validate current driver license information"""
        errors = {}
        
        if not self.driver_license:
            errors['driver_license'] = ['Driver license information is required']
            return errors
        
        if not self.driver_license.get('number'):
            errors['number'] = ['Driver license number is required']
        
        if not self.driver_license.get('expiry_date'):
            errors['expiry_date'] = ['Driver license expiry date is required']
        else:
            try:
                if isinstance(self.driver_license['expiry_date'], str):
                    expiry_date = datetime.fromisoformat(self.driver_license['expiry_date'].replace('Z', '+00:00'))
                else:
                    expiry_date = self.driver_license['expiry_date']
                
                if expiry_date < datetime.utcnow():
                    errors['expiry_date'] = ['Driver license has expired']
            except ValueError:
                errors['expiry_date'] = ['Invalid date format']
        
        return errors
    
    def is_driver_license_valid(self) -> bool:
        """Check if user has valid driver license"""
        if not self.driver_license:
            return False
        
        if not self.driver_license.get('number') or not self.driver_license.get('expiry_date'):
            return False
        
        try:
            if isinstance(self.driver_license['expiry_date'], str):
                expiry_date = datetime.fromisoformat(self.driver_license['expiry_date'].replace('Z', '+00:00'))
            else:
                expiry_date = self.driver_license['expiry_date']
            
            return expiry_date > datetime.utcnow()
        except (ValueError, TypeError):
            return False
    
    @classmethod
    def create_customer(cls, email: str, password: str, first_name: str, last_name: str, phone: str = None, **kwargs) -> 'User':
        """Create a customer user with explicit role"""
        return cls(
            email=email,
            password_hash=cls.hash_password(password),
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=UserRole.CUSTOMER.value,
            **kwargs
        )
    
    @classmethod
    def create_business_owner(cls, email: str, password: str, first_name: str, last_name: str, business_name: str, phone: str = None, **kwargs) -> 'User':
        """Create a business owner user with explicit role and business name"""
        return cls(
            email=email,
            password_hash=cls.hash_password(password),
            first_name=first_name,
            last_name=last_name,
            business_name=business_name,
            phone=phone,
            role=UserRole.BUSINESS_OWNER.value,
            **kwargs
        )
    
    def is_customer(self) -> bool:
        """Check if user is a customer"""
        return self.role == UserRole.CUSTOMER.value
    
    def is_business_owner(self) -> bool:
        """Check if user is a business owner"""
        return self.role == UserRole.BUSINESS_OWNER.value
    
    def set_business_name(self, business_name: str) -> Dict[str, List[str]]:
        """Set and validate business name for business owners"""
        errors = {}
        
        if self.role != UserRole.BUSINESS_OWNER.value:
            errors['role'] = ['Business name can only be set for business owners']
            return errors
        
        if not business_name or len(business_name.strip()) < 2:
            errors['business_name'] = ['Business name is required and must be at least 2 characters long']
            return errors
        
        if len(business_name.strip()) > 100:
            errors['business_name'] = ['Business name must be less than 100 characters']
            return errors
        
        self.business_name = business_name.strip()
        self.updated_at = datetime.utcnow()
        
        return errors
    
    def get_business_name(self) -> Optional[str]:
        """Get business name if user is a business owner"""
        return self.business_name if self.is_business_owner() else None
    
    def to_dict(self, include_sensitive=False) -> Dict[str, Any]:
        """Convert user to dictionary"""
        user_dict = {
            'id': str(self.id) if self.id else None,
            'email': self.email,
            'phone': self.phone,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'business_name': self.business_name if self.role == UserRole.BUSINESS_OWNER.value else None,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
        if include_sensitive:
            user_dict.update({
                'driver_license': self.driver_license,
                'payment_methods': self.payment_methods,
                'verification_token': self.verification_token,
                'verification_token_expires': self.verification_token_expires.isoformat() if self.verification_token_expires else None,
                'password_reset_token': self.password_reset_token,
                'password_reset_token_expires': self.password_reset_token_expires.isoformat() if self.password_reset_token_expires else None
            })
        
        return user_dict
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create User instance from dictionary"""
        # Convert string dates back to datetime objects
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
        if 'last_login' in data and isinstance(data['last_login'], str):
            data['last_login'] = datetime.fromisoformat(data['last_login'].replace('Z', '+00:00'))
        
        return cls(**data)
    
    def save(self, db) -> str:
        """Save user to database"""
        collection = db.get_collection('users')
        user_data = self.to_dict(include_sensitive=True)
        
        if self.id:
            # Update existing user
            user_data['updated_at'] = datetime.utcnow()
            collection.update_one(
                {'_id': ObjectId(self.id)},
                {'$set': user_data}
            )
        else:
            # Create new user
            user_data['created_at'] = datetime.utcnow()
            user_data['updated_at'] = datetime.utcnow()
            result = collection.insert_one(user_data)
            self.id = str(result.inserted_id)
        
        return str(self.id)
    
    @classmethod
    def find_by_email(cls, db, email: str) -> Optional['User']:
        """Find user by email"""
        collection = db.get_collection('users')
        user_data = collection.find_one({'email': email})
        if user_data:
            user_data['_id'] = str(user_data['_id'])
            return cls.from_dict(user_data)
        return None
    
    @classmethod
    def find_by_phone(cls, db, phone: str) -> Optional['User']:
        """Find user by phone"""
        collection = db.get_collection('users')
        user_data = collection.find_one({'phone': phone})
        if user_data:
            user_data['_id'] = str(user_data['_id'])
            return cls.from_dict(user_data)
        return None
    
    @classmethod
    def find_by_id(cls, db, user_id: str) -> Optional['User']:
        """Find user by ID"""
        collection = db.get_collection('users')
        user_data = collection.find_one({'_id': ObjectId(user_id)})
        if user_data:
            user_data['_id'] = str(user_data['_id'])
            return cls.from_dict(user_data)
        return None
    
    @classmethod
    def find_business_owners(cls, db, skip=0, limit=20) -> list:
        """Find all business owners"""
        collection = db.get_collection('users')
        cursor = collection.find(
            {'role': 'business_owner'},
            skip=skip,
            limit=limit
        )
        users = []
        for user_data in cursor:
            user_data['_id'] = str(user_data['_id'])
            users.append(cls.from_dict(user_data))
        return users
    
    @classmethod
    def find_business_owner_by_name(cls, db, business_name: str) -> Optional['User']:
        """Find business owner by business name"""
        collection = db.get_collection('users')
        user_data = collection.find_one({
            'role': 'business_owner',
            'business_name': {'$regex': business_name, '$options': 'i'}
        })
        if user_data:
            user_data['_id'] = str(user_data['_id'])
            return cls.from_dict(user_data)
        return None
    
    @classmethod
    def search_business_owners(cls, db, search_term: str, skip=0, limit=20) -> List['User']:
        """Search business owners by business name or owner name"""
        collection = db.get_collection('users')
        
        query = {
            'role': 'business_owner',
            '$or': [
                {'business_name': {'$regex': search_term, '$options': 'i'}},
                {'first_name': {'$regex': search_term, '$options': 'i'}},
                {'last_name': {'$regex': search_term, '$options': 'i'}}
            ]
        }
        
        cursor = collection.find(query, skip=skip, limit=limit).sort('business_name', 1)
        
        users = []
        for user_data in cursor:
            user_data['_id'] = str(user_data['_id'])
            users.append(cls.from_dict(user_data))
        return users
    
    def update_last_login(self, db):
        """Update last login timestamp"""
        collection = db.get_collection('users')
        collection.update_one(
            {'_id': ObjectId(self.id)},
            {'$set': {'last_login': datetime.utcnow()}}
        )
        self.last_login = datetime.utcnow()
    
    def delete(self, db) -> bool:
        """Delete user from database"""
        if not self.id:
            return False
        
        collection = db.get_collection('users')
        result = collection.delete_one({'_id': ObjectId(self.id)})
        return result.deleted_count > 0
