from selenium import webdriver
import time
from datetime import datetime

driver = None
tests_speed = 1.0

def open_browser(url='http://www.google.com/xhtml'):
    global driver
    driver = webdriver.Chrome('./chromedriver')  # Optional argument, if not specified will search path.
    driver.get(url);
    time.sleep(1 / tests_speed)


def quit():
    global driver
    driver.quit()


def signin(email, password):
    global driver
    driver.get('http://127.0.0.1:5000/')

    email_element = driver.find_element_by_id('welcome_login_email')
    password_element = driver.find_element_by_id('welcome_login_password')
    login_form_element = driver.find_element_by_id('login_form')
    msg = driver.find_element_by_id('hidden_success')

    time.sleep(1.0 / tests_speed)
    email_element.send_keys(email)
    time.sleep(1.0 / tests_speed)
    password_element.send_keys(password)
    time.sleep(2.0 / tests_speed)
    login_form_element.submit()
    time.sleep(0.5)
    return msg.text=='Login success!'


def home__send_message():
    global driver

    input_text_element = driver.find_element_by_id('home_new_message_text')
    submit_message_form = driver.find_element_by_id('home_new_message_form')

    time.sleep(1.0 / tests_speed)
    input_text_element.clear()
    time.sleep(0.5 / tests_speed)
    new_message = 'This is a test made with Selenium at date ' + str(datetime.now())
    input_text_element.send_keys(new_message)
    time.sleep(2.0 / tests_speed)
    submit_message_form.submit()
    time.sleep(0.5)
    return new_message in driver.page_source


def go_to_browse():
    global driver
    browse_tab_element = driver.find_element_by_id('browse_tab')
    browse_tab_element.click()
    time.sleep(1.0 / tests_speed)


def go_to_account():
    global driver
    browse_tab_element = driver.find_element_by_id('account_tab')
    browse_tab_element.click()
    time.sleep(1.0 / tests_speed)


def browse__search_user(user='b@b'):
    global driver

    time.sleep(1.0 / tests_speed)
    driver.find_element_by_id('browse_search_email').send_keys(user)
    time.sleep(1.0 / tests_speed)
    driver.find_element_by_id('browse_search_form').submit()
    time.sleep(1.0 / tests_speed)


def browse__send_message():
    global driver

    input_text_element = driver.find_element_by_id('browse_new_message_text')
    submit_message_form = driver.find_element_by_id('browse_new_message_form')

    time.sleep(1.0 / tests_speed)
    input_text_element.clear()
    time.sleep(0.5 / tests_speed)
    new_message = 'This is a test made with Selenium at date ' + str(datetime.now())
    input_text_element.send_keys(new_message)
    time.sleep(2.0 / tests_speed)
    submit_message_form.submit()
    time.sleep(0.5)
    return new_message in driver.page_source


def account__change_password(old_password, new_password=None):
    global driver

    new_password = old_password if new_password is None else new_password

    old_password_element = driver.find_element_by_name('old_password')
    new_password_element = driver.find_element_by_name('new_password')
    repeat_new_password_element = driver.find_element_by_name('repeat_new_password')
    change_password_form = driver.find_element_by_id('change_password_form')

    old_password_element.clear()
    old_password_element.send_keys(old_password)
    time.sleep(1.0 / tests_speed)
    new_password_element.clear()
    new_password_element.send_keys(new_password)
    time.sleep(1.0 / tests_speed)
    repeat_new_password_element.clear()
    repeat_new_password_element.send_keys(old_password)
    time.sleep(1.0 / tests_speed)
    change_password_form.submit()
    time.sleep(0.5)
    return 'Password changed!' in driver.page_source


def account__logout():
    global driver

    driver.find_element_by_id('account_logout').click()
    time.sleep(0.5)
    return 'Signed out.' in driver.page_source



if __name__ == '__main__':
    open_browser()

    try:

        # Test 1: Signin in
        email, password = 'a@a', '12345'
        assert(signin(email, password)); time.sleep(2.0 / tests_speed)

        # Test 2: Posting a message on my own wall
        assert(home__send_message()); time.sleep(2.0 / tests_speed)

        # Test 3: Posting a message on another wall
        go_to_browse()
        browse__search_user('z@z')
        assert(browse__send_message()); time.sleep(2.0 / tests_speed)

        # Test 4: Changing password
        go_to_account()
        assert(account__change_password(password, password)); time.sleep(2.0 / tests_speed)

        # Test 5: Logging out
        assert(account__logout()); time.sleep(2.0 / tests_speed)


    finally:
        quit()