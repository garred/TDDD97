// What to do when loading the web first time

window.onload = function() {

    // Collecting parts of the web

    var welcome_view = document.getElementById('welcome_view');
    var profile_view = document.getElementById('profile_view');
    var app_content = document.getElementById('app_content');

    // Check if a session exists

    if (localStorage.client_token) {

        // Fulfill the user info
        app_content.innerHTML = profile_view.innerHTML;
        document.getElementById('home_tab').click();
        document.getElementById('home_old_messages_update_button').click();
        var response = serverstub.getUserDataByToken(localStorage.client_token);
        document.getElementById('home_email').innerHTML = response.data.email;
        document.getElementById('home_firstname').innerHTML = response.data.firstname;
        document.getElementById('home_familyname').innerHTML = response.data.familyname;
        document.getElementById('home_gender').innerHTML = response.data.gender;
        document.getElementById('home_city').innerHTML = response.data.city;
        document.getElementById('home_country').innerHTML = response.data.country;

        // Fulfill the last user searched by the user
        browse__update_views();
    } else {
        app_content.innerHTML = welcome_view.innerHTML;
    }

};


// Validating login

function welcome__validate_login() {

    // Collecting parts of the web

    var form = document.getElementById('login_form');
    var pass = form['password'];
    var error = document.getElementById('welcome_error');
    var success = document.getElementById('welcome_success')

    // Reset error messages

    error.style.display = 'none';
    success.style.display = 'none';

    // Validating: Minimum 5 characters in password

    if (pass.value.length < 5) {
        error.style.display = 'block';
        error.innerHTML = 'Password must contain at least 5 characters.';
        return false;
    }

    // Validation correct. Sending the info

    var email = form['email'].value;
    var password = form['password'].value;
    var response = serverstub.signIn(email, password);

    // Checking server errors

    if (!response['success']) {
        error.style.display = 'block';
        error.innerHTML = response['message'];
        return false;
    }

    // Everything is correct. Inform the user and save the data.

    success.style.display = 'block';
    localStorage.client_token = response['data'];
    setTimeout(function() { window.onload() }, 1000);

    return false; //We return false anyway because we don't want to refresh the page!
};

function welcome__validate_signup() {

    // Collecting parts of the web

    var form = document.getElementById('signup_form');
    var pass1 = form['password'];
    var pass2 = form['repeated_password'];
    var error = document.getElementById('welcome_error');
    var success = document.getElementById('welcome_success');

    // Reset error messages

    error.style.display = 'none';
    success.style.display = 'none';

    // Validating

    // Minimum length
    if (pass1.value.length < 5) {
        error.style.display = 'block';
        error.innerHTML = 'Password must contain at least 5 characters.';
        return false;
    }
    // Password equal to repeated password
    if (pass1.value !== pass2.value) {
        error.style.display = 'block';
        error.innerHTML = 'Passwords are not equal.';
        return false;
    }

    // Validation correct. Sending the info
    var dataObject = {};
    dataObject.email = form['email'].value;
    dataObject.password = form['password'].value;
    dataObject.firstname = form['firstname'].value;
    dataObject.familyname = form['familyname'].value;
    dataObject.gender = form['gender'].value;
    dataObject.city = form['city'].value;
    dataObject.country = form['country'].value;

    // Checking if there is any server error
    var response = serverstub.signUp(dataObject);
    if (!response['success']) {
        error.style.display = 'block';
        error.innerHTML = response['message'];
        return false;
    }

    // Everything is correct. Inform the user and save data.
    success.style.display = 'block';

    return false; //We return false anyway because we don't want to refresh the page!
};

function account__signout() {
    serverstub.signOut(localStorage.client_token);
    localStorage.removeItem('client_token');
    localStorage.removeItem('browsed_user');
    window.onload();
}


// Profile tab controllers

function profile__home_tab_click() {
    var home_tab = document.getElementById('home_tab');
    var browse_tab = document.getElementById('browse_tab');
    var account_tab = document.getElementById('account_tab');

    home_tab.style.backgroundColor = 'var(--chosen_color)';
    browse_tab.style.backgroundColor = '';
    account_tab.style.backgroundColor = '';

    var home = document.getElementById('home_content');
    var browse = document.getElementById('browse_content');
    var account = document.getElementById('account_content');
    home.style.display = 'block';
    browse.style.display = 'none';
    account.style.display = 'none';

}

function profile__browse_tab_click() {
    var home_tab = document.getElementById('home_tab');
    var browse_tab = document.getElementById('browse_tab');
    var account_tab = document.getElementById('account_tab');

    home_tab.style.backgroundColor = '';
    browse_tab.style.backgroundColor = 'var(--chosen_color)';
    account_tab.style.backgroundColor = '';

    var home = document.getElementById('home_content');
    var browse = document.getElementById('browse_content');
    var account = document.getElementById('account_content');
    home.style.display = 'none';
    browse.style.display = 'block';
    account.style.display = 'none';
}

function profile__account_tab_click() {
    var home_tab = document.getElementById('home_tab');
    var browse_tab = document.getElementById('browse_tab');
    var account_tab = document.getElementById('account_tab');

    home_tab.style.backgroundColor = '';
    browse_tab.style.backgroundColor = '';
    account_tab.style.backgroundColor = 'var(--chosen_color)';

    var home = document.getElementById('home_content');
    var browse = document.getElementById('browse_content');
    var account = document.getElementById('account_content');
    home.style.display = 'none';
    browse.style.display = 'none';
    account.style.display = 'block';
}


// Account change password function

function account__validate_password_change() {
    var form = document.getElementById('change_password_form');
    var error = document.getElementById('change_password_error');
    var success = document.getElementById('change_password_success');
    error.style.display = 'none';
    success.style.display = 'none';

    if (form['new_password'].value !== form['repeat_new_password'].value) {
        error.style.display = 'block';
        error.innerHTML = 'Passwords are different!';
        return false;
    }

    if (form['new_password'].value.length < 5) {
        error.style.display = 'block';
        error.innerHTML = 'Password must have at least 5 characters!';
        return false;
    }

    var result = serverstub.changePassword(localStorage.client_token, form['old_password'].value, form['new_password'].value);
    if (result['success']) {
        success.innerHTML = 'Password changed!';
        success.style.display = 'block';
        return false;
    }

    error.innerHTML = result['message'];
    error.style.display = 'block';

    return false; //We always return false to avoid page refresh
}


// Home functions

function home__send_message() {
    var msg_element = document.getElementById('home_new_message_text');
    var msg = msg_element.value;
    serverstub.postMessage(localStorage.client_token, msg, null);
    msg_element.value = "";
    home__update_old_messages();

    return false;
}

function home__update_old_messages() {
    var response = serverstub.getUserMessagesByToken(localStorage.client_token);
    var place = document.getElementById('home_old_messages_content');
    place.innerHTML = '';
    for (var i=0; i<response.data.length; i++) {
        place.innerHTML = place.innerHTML + '<div class="wall_message">';
        place.innerHTML = place.innerHTML + '<div class="content">' + response.data[i].content + '</div>';
        place.innerHTML = place.innerHTML + '<div class="writer">' + response.data[i].writer + '</div>';
        place.innerHTML = place.innerHTML + '</div><br/>';
    }
}


// Browse functions

function browse__search_user() {
    var searched_email = document.getElementById('browse_search_email').value;
    var response = serverstub.getUserDataByEmail(localStorage.client_token, searched_email);
    var error_element = document.getElementById('browse_email_error');
    error_element.style.display = 'none';

    if (response.success) {

        // Saving the last searched user
        localStorage.browsed_user = searched_email;

   } else {
        localStorage.removeItem('browsed_user');
        error_element.innerHTML = "User not found!";
        error_element.style.display = 'block';
    }

    browse__update_views(response);

    return false;
}

function browse__update_views(user_info_response=null) {
    var browse_info_element = document.getElementById('browse_info');
    var browse_new_message_element = document.getElementById('browse_new_message');
    var browse_old_messages_element = document.getElementById('browse_old_messages');

    if (!localStorage.browsed_user) {
        browse_info_element.style.display = 'none';
        browse_new_message_element.style.display = 'none';
        browse_old_messages_element.style.display = 'none';
    } else {
        // Showing the views
        browse_info_element.style.display = 'block';
        browse_new_message_element.style.display = 'block';
        browse_old_messages_element.style.display = 'block';

        // Loading its info
        if (!user_info_response) {
            user_info_response = serverstub.getUserDataByEmail(localStorage.client_token, localStorage.browsed_user);
        }
        document.getElementById('browse_email').innerHTML = user_info_response.data.email;
        document.getElementById('browse_firstname').innerHTML = user_info_response.data.firstname;
        document.getElementById('browse_familyname').innerHTML = user_info_response.data.familyname;
        document.getElementById('browse_gender').innerHTML = user_info_response.data.gender;
        document.getElementById('browse_city').innerHTML = user_info_response.data.city;
        document.getElementById('browse_country').innerHTML = user_info_response.data.country;

        // Loading its messages
        browse__update_old_messages();
    }
}

function browse__send_message() {
    var msg_element = document.getElementById('browse_new_message_text');
    var msg = msg_element.value;
    serverstub.postMessage(localStorage.client_token, msg, localStorage.browsed_user);
    msg_element.value = "";
    browse__update_old_messages();

    return false;
}

function browse__update_old_messages() {
    var user_msgs_response = serverstub.getUserMessagesByEmail(localStorage.client_token, localStorage.browsed_user);
    var place = document.getElementById('browse_old_messages_content');
    place.innerHTML = '';
    for (var i=0; i<user_msgs_response.data.length; i++) {
        place.innerHTML = place.innerHTML + '<div class="wall_message">';
        place.innerHTML = place.innerHTML + '<div class="content">' + user_msgs_response.data[i].content + '</div>';
        place.innerHTML = place.innerHTML + '<div class="writer">' + user_msgs_response.data[i].writer + '</div>';
        place.innerHTML = place.innerHTML + '</div><br/>';
    }
}
