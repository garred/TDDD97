import sqlite3
from flask import g
from datetime import datetime

def connect():
    return sqlite3.connect('twidder/database.db')


def get():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = connect()
    return db


def close():
    get().close()
    g.db = None


def init():
    get()


def add_message(email_from, email_to, text):
    c = get()
    new_message = (email_from, email_to, text, str(datetime.now()))
    c.execute('insert into messages (email_from, email_to, text, date) values (?,?,?,?)', new_message)
    c.commit()


def get_messages(email_from=None, email_to=None):
    c = get()
    cu = c.cursor()

    if email_from and email_to:
        cu.execute("select email_from, email_to, text, date from messages where email_from = '{}' and email_to = '{}' order by date desc".format(
            email_from, email_to))
    elif email_from:
        cu.execute("select email_from, email_to, text, date from messages where email_from = '{}' order by date desc".format(email_from))
    elif email_to:
        cu.execute("select email_from, email_to, text, date from messages where email_to = '{}' order by date desc".format(email_to))
    else:
        return

    entries = [{'email_from': row[0], 'email_to': row[1], 'text': row[2], 'date': row[3]} for row in cu.fetchall()]

    return entries # Example: [{'text': 'Hello b.', 'email_to': 'b@b', 'email_from': 'a@a'}]


def add_user(email, password, firstname, familyname, gender, city, country, token):
    # User already exists.
    if get_user_data_by_email(email):
        return False

    c = get()
    new_user = (email, password, firstname, familyname, gender, city, country, token)
    c.execute('insert into users values (?,?,?,?,?,?,?,?)', new_user)
    c.commit()
    return True


def update_token(email, token):
    c = get()
    cu = c.cursor()
    cu.execute("update users set token='{}' where email='{}'".format(token, email))
    c.commit()


def update_password(email, newPassword):
    c = get()
    cu = c.cursor()
    cu.execute("update users set password='{}' where email='{}'".format(newPassword, email))
    c.commit()


def get_user_data_by_email(email):
    c = get()
    cu = c.cursor()
    cu.execute("select * from users where email = '{}'".format(email))

    row = cu.fetchone()
    if row is None: return None

    entry = {'email': row[0], 'password': row[1], 'firstname': row[2], 'familyname': row[3], 'gender': row[4], 'city': row[5], 'country': row[6], 'token': row[7]}

    return entry


# Testing the library

if __name__ == '__main__':
    from flask import Flask
    import time

    app = Flask(__name__)
    with app.app_context():
        init()
        add_message('a@a', 'b@b', 'Hello b. Now is {}'.format(time.strftime('%H:%M:%S, %d/%b/%y')))
        print(get_messages(email_from='a@a'))
        print(get_user_data_by_email('a@a'))


