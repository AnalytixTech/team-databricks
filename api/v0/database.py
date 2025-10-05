from flask import current_app
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    """Database connection manager"""
    
    def __init__(self, app=None):
        self.client = None
        self.db = None
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize database connection with Flask app"""
        try:
            # Create MongoDB client
            self.client = MongoClient(
                app.config['MONGODB_URI'],
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            
            # Test connection
            self.client.admin.command('ping')
            
            # Get database
            self.db = self.client[app.config['MONGODB_DB']]
            
            # Create indexes
            self._create_indexes()
            
            logger.info(f"Connected to MongoDB: {app.config['MONGODB_DB']}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Users collection indexes
            self.db.users.create_index("email", unique=True)
            self.db.users.create_index("phone", unique=True, sparse=True)
            self.db.users.create_index("role")
            
            # Cars collection indexes
            self.db.cars.create_index("business_owner_id")
            self.db.cars.create_index("make")
            self.db.cars.create_index("model")
            self.db.cars.create_index("type")
            self.db.cars.create_index("availability_status")
            self.db.cars.create_index([("make", 1), ("model", 1)])
            
            # Bookings collection indexes
            self.db.bookings.create_index("user_id")
            self.db.bookings.create_index("car_id")
            self.db.bookings.create_index("business_owner_id")
            self.db.bookings.create_index("status")
            self.db.bookings.create_index("start_date")
            self.db.bookings.create_index("end_date")
            self.db.bookings.create_index([("car_id", 1), ("start_date", 1), ("end_date", 1)])
            
            # Payments collection indexes
            self.db.payments.create_index("booking_id")
            self.db.payments.create_index("user_id")
            self.db.payments.create_index("status")
            self.db.payments.create_index("paystack_reference")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    def get_collection(self, collection_name):
        """Get a collection from the database"""
        if self.db is None:
            raise Exception("Database not initialized")
        return self.db[collection_name]
    
    def close_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Database connection closed")

# Global database instance
db = Database()

def get_db():
    """Get database instance"""
    return db
