# -*- coding: utf-8 -*-

import random

from flask import Flask, request, send_from_directory, make_response
app = Flask(__name__)

import json

from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler

import database_helper

from functools import wraps, update_wrapper
from datetime import datetime


# Global objects

logged_users_by_token = {}
websockets_by_email = {}


# Flask-related things

# Taken from https://arusahni.net/blog/2014/03/flask-nocache.html
def nocache(view):
    @wraps(view)
    def no_cache(*args, **kwargs):
        response = make_response(view(*args, **kwargs))
        response.headers['Last-Modified'] = datetime.now()
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    return update_wrapper(no_cache, view)



# Helper functions

letters = 'abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
def generate_token():
    token = ''
    for _ in range(36):
        token = token + random.choice(letters)
    return token


# Requests functions

@app.route('/')
@nocache
def main_page():
    return send_from_directory('static', 'client.html')


@app.route('/<web>')
@nocache
def web_page(web):
    return send_from_directory('static', web)


@app.route('/api/sign_in/', methods=['POST'])
def sign_in():
    arg = request.args.to_dict() # Example: {'password': '12345', 'email': 'a@a'}
    email = arg.get('email', None)
    password = arg.get('password', None)
    user = database_helper.get_user_data_by_email(email)

    if user and user['password'] == password:
        token = generate_token()
        database_helper.update_token(user['email'], token)
        logged_users_by_token[token] = email
        response = {'success': True, 'message': 'Successfully signed in.', 'token': token}
    else:
        response = {'success': False, 'message': 'Wrong username or password.'}

    return json.dumps(response)


sign_up_required_keys = ['email', 'password', 'firstname', 'familyname', 'gender', 'city', 'country']
@app.route('/api/sign_up/', methods=['POST'])
def sign_up():
    arg = request.args.to_dict()
    email = arg.get('email', None)
    password = arg.get('password', None)
    firstname = arg.get('firstname', None)
    familyname = arg.get('familyname', None)
    gender = arg.get('gender', None)
    city = arg.get('city', None)
    country = arg.get('country', None)
    token = ''

    condition = [isinstance(arg.get(key,None), str) for key in sign_up_required_keys]
    if all(condition):
        new_user = (email, password, firstname, familyname, gender, city, country, token)
        if database_helper.add_user(*new_user):
            response = {'success': True, 'message': 'Successfully created a new user.'}
        else:
            response = {'success': False, 'message': 'User already exists.'}
    else:
        response = {'success': False, 'message': 'Form data missing or incorrect type.'}

    return json.dumps(response)


@app.route('/api/sign_out/', methods=['POST'])
def sign_out():
    arg = request.args.to_dict()
    token = arg.get('token', None)
    email = logged_users_by_token.pop(token, None)

    if email:
        database_helper.update_token(email, '')
        response = {'success': True, 'message': 'Successfully signed out.'}
    else:
        response = {'success': False, 'message': 'You are not signed in.'}

    return json.dumps(response)


@app.route('/api/change_password/', methods=['POST'])
def change_password():
    arg = request.args.to_dict()
    token = arg.get('token', None)
    oldPassword = arg.get('oldPassword', None)
    newPassword = arg.get('newPassword', None)

    if token in logged_users_by_token:
        email = logged_users_by_token[token]
        user = database_helper.get_user_data_by_email(email)
        if user['password'] == oldPassword:
            database_helper.update_password(email, newPassword)
            response = {'success': True, 'message': 'Password changed.'}
        else:
            response = {'success': False, 'message': 'Wrong password.'}
    else:
        response = {'success': False, 'message': 'You are not logged in.'}

    return json.dumps(response)


@app.route('/api/get_user_data_by_token/', methods=['GET'])
def get_user_data_by_token():
    arg = request.args.to_dict()
    token = arg.get('token', None)
    email = logged_users_by_token.get(token, None)
    if email:
        response = database_helper.get_user_data_by_email(email)
        if response:
            del response['password']
            response = {'success': True, 'message': 'User data retrieved.', 'data': response}
        else:
            response = {'success': False, 'message': 'No such user. Weird error.'}
    else:
        response = {'success': False, 'message': 'You are not signed in.'}

    return json.dumps(response)


@app.route('/api/get_user_data_by_email/', methods=['GET'])
def get_user_data_by_email():
    arg = request.args.to_dict()
    email = arg.get('email', None)
    token = arg.get('token', None)

    if logged_users_by_token.get(token, None):
        response = database_helper.get_user_data_by_email(email)
        if response:
            del response['password']
            response = {'success': True, 'message': 'User data retrieved.', 'data': response}
        else:
            response = {'success': False, 'message': 'No such user.'}
    else:
        response = {'success': False, 'message': 'You are not signed in.'}

    return json.dumps(response)


@app.route('/api/get_user_messages_by_token/', methods=['GET'])
def get_user_messages_by_token():
    arg = request.args.to_dict()
    token = arg.get('token', None)
    email = logged_users_by_token.get(token, None)
    if email:
        response = database_helper.get_messages(email_to=email)
        response = {'success': True, 'message': 'User messages retrieved.', 'data': response}
    else:
        response = {'success': False, 'message': 'You are not signed in.'}

    return json.dumps(response)



@app.route('/api/get_user_messages_by_email/', methods=['GET'])
def get_user_messages_by_email():
    arg = request.args.to_dict()
    email = arg.get('email', None)
    token = arg.get('token', None)

    if logged_users_by_token.get(token, None):
        response = database_helper.get_messages(email_to=email)
        response = {'success': True, 'message': 'User messages retrieved.', 'data': response}
    else:
        response = {'success': False, 'message': 'You are not signed in.'}

    return json.dumps(response)



@app.route('/api/post_message/', methods=['POST'])
def post_message():
    arg = request.args.to_dict()
    token = arg.get('token', None)
    content = arg.get('content', None)
    fromEmail = logged_users_by_token.get(token, None)

    if fromEmail:
        toEmail = arg.get('toEmail', None)
        toEmail = toEmail if toEmail else fromEmail
        if database_helper.get_user_data_by_email(toEmail):
            database_helper.add_message(fromEmail, toEmail, content)
            response = {'success': True, 'message': 'Message posted.'}
        else:
            response = {'success': False, 'message': 'No such user.'}
        if websockets_by_email.get(toEmail, None):
            ws = websockets_by_email[toEmail]
            if not ws.closed:
                ws.send(json.dumps({'data': 'update_old_messages'}))
            else:
                del websockets_by_email[toEmail]
    else:
        response = {'success': False, 'message': 'You are not signed in.'}

    return json.dumps(response)



@app.route('/websocket')
def init_websocket():

    # Is this request made by a websocket?

    if 'wsgi.websocket' in request.environ:
        ws = request.environ['wsgi.websocket']
        msg = json.loads(ws.receive())

        token = msg.get('token', None)
        email = msg.get('email', None)

        # Check if we have another session opened with the same user. In this case, close it.

        if token in logged_users_by_token and logged_users_by_token[token] == email:
            if websockets_by_email.get(email, None): websockets_by_email[email].close() # kicks other signed in views the user could have

            websockets_by_email[email] = ws
            response = {'success': True, 'data': 'Websocket initialized'}
            ws.send(json.dumps(response))


        # Maintaining alive the websocket

        while True:
            msg = ws.receive()

            # Do something with received messages
            # ...

            # If the websocket is closed or broken, we finish
            if msg is None:
                if not ws.closed: ws.close()
                break

        return ''

    else:
        response = {'success': False, 'data': 'You have to use websockets!'}
        print(response)
        return json.dumps(response)


# Main

if __name__ == '__main__':
    app.debug = True
    server = pywsgi.WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    server.serve_forever()