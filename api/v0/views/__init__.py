#!/usr/bin/python3
'''Create a blueprint.'''

from flask import Blueprint

app_view = Blueprint('app_view', __name__, url_prefix='/api/v0')


# authentication api endpoints

from api.v0.views.authentication import *
from api.v0.views.users import *
