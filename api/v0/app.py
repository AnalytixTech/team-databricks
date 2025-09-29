#!/usr/bin/python3

from flask import Flask



app = Flask(__name__)


@app.route('/')
def home():
    '''handle home route.'''

    return('team databricks')


if __name__ == '__main__':
    app.run()
