// Global variables

var timeout_clear_messages = null;  // Function that delay the cleaning of messages. Store it to be able to cancel if needed.
var ws = null;

// What to do when loading the web first time

window.onload = function() {

    hide_popup_messages();

    // Collecting parts of the web

    var welcome_view = document.getElementById('welcome_view');
    var profile_view = document.getElementById('profile_view');
    var app_content = document.getElementById('app_content');

    // Check if a session exists

    if (sessionStorage.client_token) {

        // Fulfill the user info
        app_content.innerHTML = profile_view.innerHTML;
        document.getElementById('home_tab').click();
        document.getElementById('home_old_messages_update_button').click();

        // Preparing the callback
        var request = new XMLHttpRequest();
        request.open("GET", "/api/get_user_data_by_token/?token="+sessionStorage.client_token, true);
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

        // Checking the websocket
        if (!ws) {
            connect_websocket(sessionStorage.email, sessionStorage.client_token);
        }

        // Updating the sociogram and the barchart
        browse__sociogram();
        browse__barchart();

    } else {
        app_content.innerHTML = welcome_view.innerHTML;
    }
};


// Show messages

function popup_success(msg) {
    var s = document.getElementById('hidden_success');
    s.style.display = 'block';
    s.innerHTML = msg;
    if (timeout_clear_messages) {clearTimeout(timeout_clear_messages);}
    timeout_clear_messages = setTimeout(function() { hide_popup_messages(); }, 5000);
}

function popup_error(msg) {
    var e = document.getElementById('hidden_error');
    e.style.display = 'block';
    e.innerHTML = msg;
    if (timeout_clear_messages) {clearTimeout(timeout_clear_messages);}
    timeout_clear_messages = setTimeout(function() { hide_popup_messages(); }, 5000);
}


// Hides all messages (error or success ones)

function hide_popup_messages() {
    var error = document.getElementById('hidden_error');
    var success = document.getElementById('hidden_success');
    error.style.display = 'none';
    error.innerHTML = '';
    success.style.display = 'none';
    success.innerHTML = '';

}


// Throw away the user and go back to welcome page

function kick_out(msg) {
    var error = document.getElementById('hidden_error');
    error.style.display = 'block';
    error.innerHTML = msg;
    if (ws) { ws.close(); ws=null; }
    sessionStorage.clear();
    setTimeout(function() { window.onload(); }, 1000);
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
    sessionStorage.email = email;
    var password = form['password'].value;

    // Preparing the callback
    var request = new XMLHttpRequest();
    request.open("POST", "/api/sign_in/?email="+encodeURIComponent(email)+"&password="+encodeURIComponent(password), true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);

        // Everything is correct. Inform the user and save the data.
        if (response['success']) {
            popup_success('Login success!');
            sessionStorage.client_token = response['token'];
            connect_websocket(sessionStorage.email, sessionStorage.client_token);
            setTimeout(function() { window.onload(); }, 1000);

        // Showing errors
        } else {
            popup_error(response['message']);
        }
    };

    request.send();

    return false; //We return false anyway because we don't want to refresh the page!
}


// Creates a new websocket

function connect_websocket(email, token) {

    ws = new WebSocket('ws://127.0.0.1:5000/websocket');

    ws.onopen = function () {
        var msg = {'request': 'init', 'email': email, 'token': token};
        ws.send(JSON.stringify(msg));
        console.log('Connected.');
    };

    ws.onerror = function () {
        console.log('Error.');
        ws = null;
        kick_out('Signed out by error in websocket connection.');
    };

    ws.onmessage = function (event) {
        var msg = JSON.parse(event.data);
        if (msg.data == "update_old_messages") {
            document.getElementById('home_old_messages_update_button').click();
            document.getElementById('browse_old_messages_update_button').click();
            popup_success('You have a new message!');
            browse__sociogram();
            browse__barchart();
        }

        if (msg.data == "ok") {
            console.log("Websocket is ok");
        }

        console.log('Message: ' + event.data);
    };

    ws.onclose = function () {
        console.log('WS closed.');
        ws = null;
        kick_out('Signed out.');
    }
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
    request.open("POST", "/api/sign_out/?token="+sessionStorage.client_token, true);
    request.send();
    if (ws) { ws.close(); ws=null; }
    sessionStorage.clear();
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
        "/api/change_password/?token="+sessionStorage.client_token+"&oldPassword="+encodeURIComponent(oldPassword)+
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
        "/api/post_message/?token="+sessionStorage.client_token+"&content="+encodeURIComponent(msg),
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

    request.open("GET", "/api/get_user_messages_by_token/?token="+sessionStorage.client_token, true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);
        if (response.success) {
            var place = document.getElementById('home_old_messages_content');
            place.innerHTML = '';
            for (var i = 0; i < response.data.length; i++) {
                var msg_html = '<div class="wall_message" id='+message_unique_name() +' draggable="true" ondragstart="drag_message(event)">';
                msg_html += '<div class="msg_content">' + response.data[i].text + '</div>';
                msg_html += '<div class="msg_writer">' + response.data[i].email_from + '</div>';
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
        "&token="+sessionStorage.client_token,
        true);
    request.onload = function() {
        var response = JSON.parse(request.responseText);

        if (response.success) {
            // Saving the last searched user
            sessionStorage.browsed_user = searched_email;
       } else {
            sessionStorage.removeItem('browsed_user');
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

    if (!sessionStorage.browsed_user) {
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
            request.open("GET", "/api/get_user_data_by_email/?email="+encodeURIComponent(sessionStorage.browsed_user)+"&token="+sessionStorage.client_token, true);
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
        "/api/post_message/?token="+sessionStorage.client_token+"&toEmail="+sessionStorage.browsed_user+
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

    browse__sociogram();
    browse__barchart();

    return false;
}


// Update old messages in `browse` view

function browse__update_old_messages() {
    var request = new XMLHttpRequest();
    request.open("GET", "/api/get_user_messages_by_email/?token="+sessionStorage.client_token+"&email="+sessionStorage.browsed_user, true);

    request.onload = function() {
        var response = JSON.parse(request.responseText);
        if (response.success) {
            var place = document.getElementById('browse_old_messages_content');
            place.innerHTML = '';
            for (var i=0; i<response.data.length; i++) {
                var msg_html = '<div class="wall_message" id='+message_unique_name() +' draggable="true" ondragstart="drag_message(event)">';
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



// Generates the sociogram. Based on https://bl.ocks.org/mbostock/4062045
// Other useful pages:
    // https://bost.ocks.org/mike/bar/
    // http://codepen.io/mulderp/pen/KGFvx
    // http://thinkingonthinking.com/Getting-Started-With-D3/
function browse__sociogram() {
    var w=400, h=200;

    var svg = d3.select("#sociogram")
            .attr("width", w)
            .attr("height", h);
    svg.selectAll("*").remove();

    var simulation = d3.forceSimulation()
            .force("link",
                    d3.forceLink()
                            .id(function(d) { return d.id; })
                            .strength(function(d) { return d.value; })
            )
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(w / 2, h / 2));

    d3.json("api/gather_social_network_data/?token="+sessionStorage.client_token, function(error, graph) {
        if (error) console.warn(error);

        var link = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(graph.links)
                .enter().append("line")
                .attr("stroke", "black")
                .attr("stroke-width", function(d) { return Math.sqrt(d.value*10.0); });

        var node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(graph.nodes)
                .enter().append("circle")
                .attr("r", 20)
                .attr("fill", function(d) { return "white"; })
                .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));

        var caption = svg.append("g")
                .attr("class", "caption")
                .selectAll("caption")
                .data(graph.nodes)
                .enter().append("text")
                .text(function(d) { return d.id; })
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "central")
                .attr("font-size", "10");

        simulation
                .nodes(graph.nodes)
                .on("tick", ticked);

        simulation.force("link")
                .links(graph.links);

        function ticked() {
            link
                    .attr("x1", function(d) { return Math.min(w-20, Math.max(20, d.source.x)); })
                    .attr("y1", function(d) { return Math.min(h-20, Math.max(20, d.source.y)); })
                    .attr("x2", function(d) { return Math.min(w-20, Math.max(20, d.target.x)); })
                    .attr("y2", function(d) { return Math.min(h-20, Math.max(20, d.target.y)); });
            node
                    .attr("cx", function(d) { return Math.min(w-20, Math.max(20, d.x)); })
                    .attr("cy", function(d) { return Math.min(h-20, Math.max(20, d.y)); })
            caption
                    .attr("x", function(d) { return Math.min(w-20, Math.max(20, d.x)); })
                    .attr("y", function(d) { return Math.min(h-20, Math.max(20, d.y)); })
        }
    });

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}


// Generates a barchart. Based on https://bost.ocks.org/mike/bar/
function browse__barchart() {
    var w=400, h=200, bar_height=20;

    var svg = d3.select("#barchart")
            .attr("width", w)
            .attr("height", h);
    svg.selectAll("*").remove();

    d3.json("api/gather_social_network_data/?token="+sessionStorage.client_token, function(error, graph) {
        if (error) console.warn(error);

        var max_links = 0;
        var nodes = {};
        for (var link of graph.links) {
            nodes[link.source] = (nodes[link.source] || 0) + 1;
            nodes[link.target] = (nodes[link.target] || 0) + 1;
            max_links = Math.max(max_links, nodes[link.source]);
        }

        var bars = svg.append("g")
            .selectAll("rect")
            .data(d3.entries(nodes))
            .enter().append("rect")
            .attr("transform", function(d,i) {
                return "translate(0," + i*bar_height + ")";
            })
            .attr("height", bar_height-1)
            .attr("width", 0)
            .transition().duration(1000)
            .attr("width", function(d,i) {return (d.value/max_links)*300.0;});


        var names = svg.append("g")
            .selectAll("text")
            .data(d3.entries(nodes))
            .enter().append("text")
            .attr("transform", function(d,i) {
                return "translate(5," + (i+0.5)*bar_height + ")";
            })
            .text(function(d,i) {return d.key;});
    });
}


function drag_message(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function allow_drop(ev) {
    ev.preventDefault();
}

function drop_message(ev) {
    var data = ev.dataTransfer.getData("text");
    var msg = document.getElementById(data);
    if (msg) {
        ev.preventDefault();
        ev.target.value = ">>> " + msg.childNodes[0].innerText + " (" + msg.childNodes[1].innerText + ")\n";
    }
}

var message_number = 0
function message_unique_name() {
    message_number += 1;
    return "msg_" + message_number;
}