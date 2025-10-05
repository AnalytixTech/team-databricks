from datetime import datetime
from bson import ObjectId
from typing import Optional, Dict, Any, List
from enum import Enum

class PaymentStatus(Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class PaymentType(Enum):
    """Payment type enumeration"""
    DEPOSIT = "deposit"
    RENTAL_FEE = "rental_fee"
    FULL_PAYMENT = "full_payment"
    REFUND = "refund"

class Payment:
    """Payment model for the car rental application"""
    
    def __init__(self, **kwargs):
        self.id = kwargs.get('_id')
        self.booking_id = kwargs.get('booking_id')
        self.user_id = kwargs.get('user_id')
        self.business_owner_id = kwargs.get('business_owner_id')
        self.payment_type = kwargs.get('payment_type', PaymentType.DEPOSIT.value)
        self.amount = kwargs.get('amount', 0.0)
        self.currency = kwargs.get('currency', 'NGN')
        self.status = kwargs.get('status', PaymentStatus.PENDING.value)
        self.paystack_reference = kwargs.get('paystack_reference')
        self.paystack_authorization_url = kwargs.get('paystack_authorization_url')
        self.paystack_access_code = kwargs.get('paystack_access_code')
        self.payment_method = kwargs.get('payment_method', {})
        self.description = kwargs.get('description', '')
        self.metadata = kwargs.get('metadata', {})
        self.refund_amount = kwargs.get('refund_amount', 0.0)
        self.refund_reason = kwargs.get('refund_reason')
        self.refunded_at = kwargs.get('refunded_at')
        self.paid_at = kwargs.get('paid_at')
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert payment to dictionary"""
        return {
            'id': str(self.id) if self.id else None,
            'booking_id': str(self.booking_id) if self.booking_id else None,
            'user_id': str(self.user_id) if self.user_id else None,
            'business_owner_id': str(self.business_owner_id) if self.business_owner_id else None,
            'payment_type': self.payment_type,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'paystack_reference': self.paystack_reference,
            'paystack_authorization_url': self.paystack_authorization_url,
            'paystack_access_code': self.paystack_access_code,
            'payment_method': self.payment_method,
            'description': self.description,
            'metadata': self.metadata,
            'refund_amount': self.refund_amount,
            'refund_reason': self.refund_reason,
            'refunded_at': self.refunded_at.isoformat() if self.refunded_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Payment':
        """Create Payment instance from dictionary"""
        # Convert string dates back to datetime objects
        if 'refunded_at' in data and isinstance(data['refunded_at'], str):
            data['refunded_at'] = datetime.fromisoformat(data['refunded_at'].replace('Z', '+00:00'))
        if 'paid_at' in data and isinstance(data['paid_at'], str):
            data['paid_at'] = datetime.fromisoformat(data['paid_at'].replace('Z', '+00:00'))
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
        
        return cls(**data)
    
    def save(self, db) -> str:
        """Save payment to database"""
        collection = db.get_collection('payments')
        payment_data = self.to_dict()
        
        if self.id:
            # Update existing payment
            payment_data['updated_at'] = datetime.utcnow()
            collection.update_one(
                {'_id': ObjectId(self.id)},
                {'$set': payment_data}
            )
        else:
            # Create new payment
            payment_data['created_at'] = datetime.utcnow()
            payment_data['updated_at'] = datetime.utcnow()
            result = collection.insert_one(payment_data)
            self.id = str(result.inserted_id)
        
        return str(self.id)
    
    @classmethod
    def find_by_id(cls, db, payment_id: str) -> Optional['Payment']:
        """Find payment by ID"""
        collection = db.get_collection('payments')
        payment_data = collection.find_one({'_id': ObjectId(payment_id)})
        if payment_data:
            payment_data['_id'] = str(payment_data['_id'])
            return cls.from_dict(payment_data)
        return None
    
    @classmethod
    def find_by_paystack_reference(cls, db, paystack_reference: str) -> Optional['Payment']:
        """Find payment by Paystack reference"""
        collection = db.get_collection('payments')
        payment_data = collection.find_one({'paystack_reference': paystack_reference})
        if payment_data:
            payment_data['_id'] = str(payment_data['_id'])
            return cls.from_dict(payment_data)
        return None
    
    @classmethod
    def find_by_booking(cls, db, booking_id: str) -> List['Payment']:
        """Find payments by booking ID"""
        collection = db.get_collection('payments')
        cursor = collection.find({'booking_id': ObjectId(booking_id)}).sort('created_at', -1)
        
        payments = []
        for payment_data in cursor:
            payment_data['_id'] = str(payment_data['_id'])
            payments.append(cls.from_dict(payment_data))
        return payments
    
    @classmethod
    def find_by_user(cls, db, user_id: str, skip=0, limit=20) -> List['Payment']:
        """Find payments by user ID"""
        collection = db.get_collection('payments')
        cursor = collection.find(
            {'user_id': ObjectId(user_id)},
            skip=skip,
            limit=limit
        ).sort('created_at', -1)
        
        payments = []
        for payment_data in cursor:
            payment_data['_id'] = str(payment_data['_id'])
            payments.append(cls.from_dict(payment_data))
        return payments
    
    @classmethod
    def find_by_business_owner(cls, db, business_owner_id: str, skip=0, limit=20) -> List['Payment']:
        """Find payments by business owner ID"""
        collection = db.get_collection('payments')
        cursor = collection.find(
            {'business_owner_id': ObjectId(business_owner_id)},
            skip=skip,
            limit=limit
        ).sort('created_at', -1)
        
        payments = []
        for payment_data in cursor:
            payment_data['_id'] = str(payment_data['_id'])
            payments.append(cls.from_dict(payment_data))
        return payments
    
    def update_status(self, db, status: str, paystack_data: Dict[str, Any] = None):
        """Update payment status"""
        collection = db.get_collection('payments')
        
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        
        if status == PaymentStatus.SUCCESSFUL.value:
            update_data['paid_at'] = datetime.utcnow()
        
        if paystack_data:
            if 'reference' in paystack_data:
                update_data['paystack_reference'] = paystack_data['reference']
            if 'authorization_url' in paystack_data:
                update_data['paystack_authorization_url'] = paystack_data['authorization_url']
            if 'access_code' in paystack_data:
                update_data['paystack_access_code'] = paystack_data['access_code']
        
        collection.update_one(
            {'_id': ObjectId(self.id)},
            {'$set': update_data}
        )
        
        self.status = status
        self.updated_at = datetime.utcnow()
        if status == PaymentStatus.SUCCESSFUL.value:
            self.paid_at = datetime.utcnow()
    
    def process_refund(self, db, refund_amount: float, reason: str):
        """Process refund for payment"""
        collection = db.get_collection('payments')
        
        # Calculate new status based on refund amount
        if refund_amount >= self.amount:
            new_status = PaymentStatus.REFUNDED.value
        else:
            new_status = PaymentStatus.PARTIALLY_REFUNDED.value
        
        update_data = {
            'status': new_status,
            'refund_amount': refund_amount,
            'refund_reason': reason,
            'refunded_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        collection.update_one(
            {'_id': ObjectId(self.id)},
            {'$set': update_data}
        )
        
        self.status = new_status
        self.refund_amount = refund_amount
        self.refund_reason = reason
        self.refunded_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def is_successful(self) -> bool:
        """Check if payment is successful"""
        return self.status == PaymentStatus.SUCCESSFUL.value
    
    def is_refunded(self) -> bool:
        """Check if payment is refunded"""
        return self.status in [PaymentStatus.REFUNDED.value, PaymentStatus.PARTIALLY_REFUNDED.value]
    
    def can_be_refunded(self) -> bool:
        """Check if payment can be refunded"""
        return self.status == PaymentStatus.SUCCESSFUL.value and not self.is_refunded()
    
    def get_remaining_amount(self) -> float:
        """Get remaining amount that can be refunded"""
        if not self.is_successful():
            return 0.0
        return self.amount - self.refund_amount
    
    def delete(self, db) -> bool:
        """Delete payment from database"""
        if not self.id:
            return False
        
        collection = db.get_collection('payments')
        result = collection.delete_one({'_id': ObjectId(self.id)})
        return result.deleted_count > 0
