#!/usr/bin/python3
'''user api endpoints handler'''

from api.v0.views import app_view
from api.v0.models.user import User

from api.v0.database import db

@app_view.route('/users', strict_slashes=False)
def get_users():
    '''retrive users from storage.'''

    print('hello world')
    users = db.users.find()
    print(user)
