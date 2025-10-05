import os
from flask import Flask, jsonify
from database import db
from config import config
from services.health_check import health_check_service

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize database
    db.init_app(app)
    
    @app.route('/')
    def home():
        """Handle home route"""
        return jsonify({
            'message': 'Car Rental API - Models & Database Ready',
            'version': '1.0.0',
            'status': 'running'
        })
    
    @app.route('/health')
    def health_check():
        """Health check endpoint"""
        health_status = health_check_service.get_overall_health()
        status_code = 200 if health_status['status'] == 'healthy' else 500
        return jsonify(health_status), status_code
    
    @app.route('/health/cloud-storage')
    def cloud_storage_health():
        """Dedicated cloud storage health check endpoint"""
        result = health_check_service.get_cloud_storage_details()
        status_code = 200 if result['status'] == 'healthy' else 500
        return jsonify(result), status_code
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
