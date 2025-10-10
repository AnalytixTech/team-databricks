#!/usr/bin/python3
'''Authentication class handler'''

from flask import request
from typing import TypeVar, List, Iterable


class Auth():
    '''Define the authentication class for the api.'''

    def require_auth(self, path: str, included_paths: List[str]) -> bool:
        """checks if the requsted path requires authentication:
        Args:
            path: url path requested by the user
            included_paths: list of strings(paths that require authentication)
        Return:
            return a Boolean value based in the inputs
        """

        if len(included_paths) >= 1:
            if type(path) is str:
                if path in included_paths or path[0:-2] in included_paths:
                    return True
                if path + '/' in included_paths:
                    return True
        return False

    def get_auth_header(self, request=None) -> str:
        '''Check and retrive the authorization header for credentials.
        Args:
            request: flask request object
        Return:
            returns the value of the in the authorization header otherwise None.
        '''

        if request is not None:
            if request.headers.get('Authorization'):
                return request.headers['Authorization']
        return None


    def get_current_user(self, request=None) -> str:
        '''Brings all the functions together to and retrives the current users id
        Args:
            request: flask request object.
        Return:
            returns the current users instance on success otherwise None.
        '''

        return None

    def session_cookie(self, request=None) -> str:
        '''Retrives a cookie value from the request header
        Args:
            request: the flask request object
        Return:
            returns the cookie string on success or None otherwise.
        '''

        if request:
            return request.cookies.get('_my_sessions_id')
        return None

    def login(self, request=None):
        '''Authenticate an existing user
        Args:
            request: flask request model
        Rerutn:
            returns a user instance.'''

        if request:
            received_email = request.form.get('email', None)
            received_pwd = request.form.get('password', None)
            if received_email:
                # retrive a user with this email
                pass
                #check is users password is as the on received

                #create a new session for the user and send a session cookie



    def signin(self, request) -> bool:
        '''Stop the use of a session id.
        Args:
            request: The flask request object
        return:
            return a True on success otherwise False
        '''

        if request:
            session_id = self.session_cookie(request)
            if session_id:
                user_id = self.user_id_for_session_id(session_id)
                if user_id:
                    del self.user_id_for_session_id[session_id]
                    return True
        return False
