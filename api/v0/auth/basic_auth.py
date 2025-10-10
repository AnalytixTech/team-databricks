#!/usr/bin/python3
'''Basic authentication implementation.'''

from api.v0.auth.auth import Auth
from flask import abort, request
import base64
from typing import TypeVar


class Basic_Auth(Auth):
    '''Basic Authentication'''

    def extract_b64_auth_header(self, authorization_header: str) -> str:
        '''Returns the value of the authorization header
        Args:
            authorization_header: base 64 auth header string
        Return:
        return the auth key
        '''

        if authorization_header and type(authorization_header) is str:
            if authorization_header.split(' ')[0] == 'Basic':
                return authorization_header.split(' ')[1]
        return None

    def decode_b64_authorization_header(self, base64_authorization_header: str) -> str:
        '''Return the decoded values of the authorization_header
        Args:
            base64_authorization_header: str
        Return:
            return users credentials
        '''

        if base64_authorization_header and type(base64_authorization_header) is str:
            try:
                b64_decoded = base64.b64decode(base64_authorization_header)
                str_decoded = b64_decoded.decode('utf-8')
                return str_decoded
            except:
                pass
        return None
    
    def extract_user_credentials(self, decoded_auth_header: str) -> (str, str):
        '''Return user credentials from decoded authorization header
        Arrgs:
            decoded_auth_header
        Return:
        return a tuple containing the user password and email.
        '''

        if decoded_auth_header and type(decoded_auth_header) is str:
            if ':' in decoded_auth_header:
                credentials = decoded_auth_header.split(':')
                return (credentials[0], credentials[1])
        return None

    def extract_user_with_creds(self, email: str, password: str) -> TypeVar('User'):
        '''Get the user with the priviced credentials
        Args:
            email: string  representing a users email
            password: string representing a user password
        Return: User instance
        '''

        if email and type(email) is str:
            if password and type(password) is str:
                # query db for user data and return it
                pass
        return None

    def current_user(self) -> TypeVar('User'):
        '''Use the above metjods to get users data
        Return:
            return a user instance/
        '''

        authorization_header = self.auth_header()
        auth_token = self.extract_b64_auth_header(authorization_header)
        decoded_tokens = self.decode_b64_authorization_header(auth_token)
        user_credentials = self.extract_user_credentials(decoded_tokens)
        user = self.retrive_user_with_creds(user_credentials)
        return user
