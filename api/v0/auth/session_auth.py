#!/usr/bin/python3
"""Session authentication class."""
from .auth import Auth
from datetime import datetime
from flask import Flask
import uuid
#import users model
from typing import TypeVar

class SessionAuth(Auth):

    session_id_dict = {}
    duration = 1300

    @staticmethod
    def create_session(self, user_id: str = None) -> str:
        '''Creates a new session instance adn adds it to memory
        Args:
            user_id: string representation of users id
        Return:
            return the new sessions id.
        '''

        if user_id and type(user_id) is str:
            session_id = str(uuid.uuid4())
            # add session id to dict of session_ids
            self.session_id_dict[session_id] = {'user_id': user_id, 'created_at': datetime.now()}
            # save the session info
            return session_id
        return None

    def user_id_for_session_id(self, session_id: str = None) -> str:
        '''Retrives the user id related to the session id
        Args:
            session_id: string value representing a valid sessions id
        Return:
            return the session_id value if available otherwise null.
        '''

        if session_id and type(session_id) is str:
            #check session_id_dict for session id as key
            if session_id in self.session_id_dict:
                # extract session data
                session_data = self.session_id_dict[session_id]
                if 'created_at' in session_data:
                    '''if session_data['created_at'] + self.duration < datetime.now():
                        # Delete this session from memory
                        pass
                    '''
                    if 'user_id' in session_data:
                        return session_data['user_id']
        return None

    def current_user(self, request=None):
        '''Extracts the current user from the session_id
        Args:
            request: The flask request object
        Return:
            returns a reference to a user instance on success otherwise None.
        '''

        session_id = self.session_cookies(request)
        user_id = self.user_id_for_session_id(session_id)
        #get the user with the above id and return it

    def destroy_session(self, request=None) -> bool:
        '''Removes an existing session.
        Args:
            request: The flask request object
        Return:
            returns True on success otherwise false.
        '''

        if request and len(request.cookies) >= 1:
            session_id = super().session_cookie(request)
            if session_id:
                if self.user_id_for_session_id(session_id):
                    del self.session_id_dict[session_id]
                    return True
        return False
# i could create an instance to save the session information to storage and save them on creation and delete them on verification and destruction.
