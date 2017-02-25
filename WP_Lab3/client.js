
// What to do when loading the web first time

window.onload = function() {

    hide_popup_messages();

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

        // Preparing the callback
        var request = new XMLHttpRequest();
        request.open("GET", "/api/get_user_data_by_token/?token="+localStorage.client_token, true);
        request.onload = function() {
            var response = JSON.parse(request.responseText);
            if (response.success) {
                document.getElementById('home_email').innerHTML = response.data.email;
                document.getElementById('home_firstname').innerHTML = response.data.firstname;
                document.getElementById('home_familyname').innerHTML = response.data.familyname;
                document.getElementById('home_gender').innerHTML = response.data.gender;
                document.getElementById('home_city').innerHTML = response.data.city;
                document.getElementById('home_country').innerHTML = response.data.country;
            } else {
                kick_out(response.message);
            }
        };
        request.send();

        // Fulfill the last user searched by the user
        browse__update_views();
    } else {
        app_content.innerHTML = welcome_view.innerHTML;
    }





};


    // Web sockets

    var socket = new WebSocket('ws://127.0.0.1:5000/websocket');
    socket.onopen = function() {
        var msg = {'data': 'Hello world!'};
        socket.send(JSON.stringify(msg));
        console.log('Connected.');
    };

    socket.onerror = function() {
        console.log('Error.');
    };

    socket.onmessage = function(event) {
        console.log('Message: ' + event.data);
    };

    socket.onclose = function() {
        console.log('WS closed.');
    }




// Show messages

function popup_success(msg) {
    var s = document.getElementById('hidden_success');
    s.style.display = 'block';
    s.innerHTML = msg;
}

function popup_error(msg) {
    var e = document.getElementById('hidden_error');
    e.style.display = 'block';
    e.innerHTML = msg;
}


// Hides all messages (error or success ones)

function hide_popup_messages() {
    var error = document.getElementById('hidden_error');
    var success = document.getElementById('hidden_success');
    error.style.display = 'none';
    success.style.display = 'none';
}


// Throw away the user and go back to welcome page

function kick_out(msg) {
    var error = document.getElementById('hidden_error');
    error.style.display = 'block';
    error.innerHTML = msg;
    localStorage.clear();
    setTimeout(function() {
        window.onload();
    }, 1000);
}


// Validating login

function welcome__validate_login() {

    hide_popup_messages();

    // Collecting parts of the web

    var form = document.getElementById('login_form');
    var pass = form['password'];

    // Validating: Minimum 5 characters in password

    if (pass.value.length < 5) {
        popup_error('Password must contain at least 5 characters.');
        return false;
    }

    // Validation correct. Sending the info

    var email = form['email'].value;
    var password = form['password'].value;

    // Preparing the callback
    var request = new XMLHttpRequest();
    request.open("GET", "/api/sign_in/?email="+encodeURIComponent(email)+"&password="+encodeURIComponent(password), true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);

        // Checking server errors

        if (!response['success']) {
            popup_error(response['message']);

        } else {
            // Everything is correct. Inform the user and save the data.

            popup_success('Login success!');
            localStorage.client_token = response['token'];
            setTimeout(function() { window.onload(); }, 1000);
        }
    };

    request.send();


    return false; //We return false anyway because we don't want to refresh the page!
}


// Sending sign up data

function welcome__validate_signup() {

    hide_popup_messages();

    // Collecting parts of the web

    var form = document.getElementById('signup_form');
    var pass1 = form['password'];
    var pass2 = form['repeated_password'];

    // Validating

    // Minimum length
    if (pass1.value.length < 5) {
        popup_error('Password must contain at least 5 characters.');
        return false;
    }
    // Password equal to repeated password
    if (pass1.value !== pass2.value) {
        popup_error('Passwords are not equal.');
        return false;
    }

    // Validation correct. Sending the info
    var email = form['email'].value;
    var password = form['password'].value;
    var firstname = form['firstname'].value;
    var familyname = form['familyname'].value;
    var gender = form['gender'].value;
    var city = form['city'].value;
    var country = form['country'].value;

    // Checking if there is any server error

    // Preparing the callback
    var request = new XMLHttpRequest();
    request.open("POST", "/api/sign_up/?email="+encodeURIComponent(email)+"&password="+encodeURIComponent(password)
        +"&firstname="+encodeURIComponent(firstname)+"&familyname="+encodeURIComponent(familyname)+
        "&gender="+encodeURIComponent(gender)+"&city="+encodeURIComponent(city)+"&country="+encodeURIComponent(country),
        true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);
        if (response['success']) {
            popup_success(response['message']);
        } else {
            popup_error(response['message']);
        }
    };

    request.send();

    return false; //We return false anyway because we don't want to refresh the page!
}


// Sign out

function account__signout() {
    // Preparing the callback
    var request = new XMLHttpRequest();
    request.open("GET", "/api/sign_out/?token="+localStorage.client_token, true);
    request.send();
    localStorage.clear();
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

    hide_popup_messages();

    var form = document.getElementById('change_password_form');

    if (form['new_password'].value !== form['repeat_new_password'].value) {
        popup_error('Passwords are different!');
        return false;
    }

    if (form['new_password'].value.length < 5) {
        popup_error('Password must have at least 5 characters!');
        return false;
    }

    var oldPassword = form['old_password'].value;
    var newPassword = form['new_password'].value;

    // Preparing the callback
    var request = new XMLHttpRequest();

    request.open("POST",
        "/api/change_password/?token="+localStorage.client_token+"&oldPassword="+encodeURIComponent(oldPassword)+
        "&newPassword="+encodeURIComponent(newPassword),
        true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);
        if (response['success']) {
            popup_success('Password changed!');
        } else {
            popup_error(response['message']);
        }
    };

    request.send();

    return false; //We always return false to avoid page refresh
}


// Home functions

function home__send_message() {
    var msg_element = document.getElementById('home_new_message_text');
    var msg = msg_element.value;

    // Preparing the callback
    var request = new XMLHttpRequest();

    request.open("POST",
        "/api/post_message/?token="+localStorage.client_token+"&content="+encodeURIComponent(msg),
        true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);
        if (response.success) {
            msg_element.value = "";
            home__update_old_messages();
        } else {
            kick_out(response.message);
        }
    };

    request.send();

    return false;
}


// Update the old messages view

function home__update_old_messages() {
    // Preparing the callback
    var request = new XMLHttpRequest();

    request.open("GET", "/api/get_user_messages_by_token/?token="+localStorage.client_token, true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);
        if (response.success) {
            var place = document.getElementById('home_old_messages_content');
            place.innerHTML = '';
            for (var i = 0; i < response.data.length; i++) {
                var msg_html = '<div class="wall_message">';
                msg_html += '<div class="content">' + response.data[i].text + '</div>';
                msg_html += '<div class="writer">' + response.data[i].email_from + '</div>';
                msg_html += '</div><br/>';
                place.innerHTML += msg_html;
            }
        } else {
            kick_out(response.message);
        }
    };
    request.send();
}


// Browse functions

function browse__search_user() {

    hide_popup_messages();

    var searched_email = document.getElementById('browse_search_email').value;

    // Preparing the callback
    var request = new XMLHttpRequest();
    request.open("GET", "/api/get_user_data_by_email/?email="+encodeURIComponent(searched_email)+
        "&token="+localStorage.client_token,
        true);
    request.onload = function() {
        var response = JSON.parse(request.responseText);

        if (response.success) {
            // Saving the last searched user
            localStorage.browsed_user = searched_email;
       } else {
            localStorage.removeItem('browsed_user');
            popup_error('User not found!');
        }

        browse__update_views(response);
    };
    request.send();

    return false;
}


// Updates all the `browse` view, accordingly with the last browse done.

function browse__update_views(user_info_response = null) {
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

            var request = new XMLHttpRequest();
            request.open("GET", "/api/get_user_data_by_email/?email="+encodeURIComponent(localStorage.browsed_user)+"&token="+localStorage.client_token, true);
            request.onload = function() {
                var response = JSON.parse(request.responseText);
                if (response.success) {
                    document.getElementById('browse_email').innerHTML = response.data.email;
                    document.getElementById('browse_firstname').innerHTML = response.data.firstname;
                    document.getElementById('browse_familyname').innerHTML = response.data.familyname;
                    document.getElementById('browse_gender').innerHTML = response.data.gender;
                    document.getElementById('browse_city').innerHTML = response.data.city;
                    document.getElementById('browse_country').innerHTML = response.data.country;
                    // Loading its messages
                    browse__update_old_messages();
                } else {
                    kick_out(response.message);
                }
            };
            request.send();

        } else {
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
}


// Send a message to a browsed user

function browse__send_message() {
    var msg_element = document.getElementById('browse_new_message_text');
    var msg = msg_element.value;

    // Preparing the callback
    var request = new XMLHttpRequest();

    request.open("POST",
        "/api/post_message/?token="+localStorage.client_token+"&toEmail="+localStorage.browsed_user+
        "&content="+encodeURIComponent(msg),
        true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);
        if (response.success) {
            msg_element.value = "";
            browse__update_old_messages();
        } else {
            kick_out(response.message);
        }
    };

    request.send();

    return false;
}


// Update old messages in `browse` view

function browse__update_old_messages() {
    var request = new XMLHttpRequest();
    request.open("GET", "/api/get_user_messages_by_email/?token="+localStorage.client_token+"&email="+localStorage.browsed_user, true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);
        if (response.success) {
            var msg = response.data;

            var place = document.getElementById('browse_old_messages_content');
            place.innerHTML = '';
            for (var i=0; i<msg.length; i++) {
                var msg_html = '<br/><div class="wall_message">';
                msg_html += '<div class="content">' + msg[i].text + '</div>';
                msg_html += '<div class="writer">' + msg[i].email_from + '</div>';
                msg_html += '</div>';
                place.innerHTML += msg_html;
            }
        } else {
            kick_out(response.message);
        }
    };

    request.send();
}

