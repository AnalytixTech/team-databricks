#!/usr/bin/python3
'''Authentication api endpoints.'''

from api.v0.auth.basic_auth import Basic_Auth
from api.v0.views import app_view
from api.v0.database import db
import base64
from flask import request, make_response
from api.v0.models.user import User


def create_auth_token(email, pwd):
    '''Create  an encoding of email and user password.
    Args:
        email: user email
        pwd: user password
    Return:
        return email:pwd in base64 endoded.
    '''

    if email and type(email) is str:
        if pwd and type(pwd) is str:
            token = '{}:{}'.format(email, pwd)
            hashed_token = base64.b64encode(token.encode('utf-8')).decode('utf-8')
            return hashed_token


@app_view.route('/authentication/login', methods=['POST'], strict_slashes=False)
def user_login():
    '''POST /api/v0/authentication/login.
    Autheenticate an existing user.
    '''

    if request.method is 'POST':
        # get request form
        user_email = request.form.get('email')
        user_pwd = request.form.get('password')

        # make a query to db for email.
        user = db.user.find({'email': user_email})
        if user:
            pwd_hash = User.check_password(user_pwd)
            #  check the users password
            if user['password_hash'] == pwd_hash:
                # creat an authentication token for user
                autorization_token = crate_auth_token(user_email, user_pwd)
                response = make_response()
                response.set_cookies('Auth_toen', authorization_token, max_age=3600)
                # send a link to the user email
                return response
                return jsonify({'message': 'Success'})
            else:
                return jsonify({'message': 'Password Error'})
        return jsonify({'message': 'Email Error'})

@app_view.route('/authentication/sign_in', methods=['POST'], strict_slashes=False)
def user_sigmin():
    '''POST /api/v0/authentication/sign_in
    Create a new user instance and session for it.
    '''

    if request.method is 'POST':
        data = request.get_json()
        # check for required fields
        if 'email' in data and 'password' in data:
            if 'name' in data and name is not 'Admin':
                if db.user.find({'email': data['email']}) == None:
                    new_user = User(**data)
                    user = User(**data)
                    #db.user.insert_one(user.__dict__)
                    # create a token to the user
                    auth_token = create_auth_token(user.email, User.check_password(user.hashed_password))
                    print(auth_token)
