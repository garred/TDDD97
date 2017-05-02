from twidder.twidder import app
from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler

if __name__ == '__main__':
    app.debug = True
    server = pywsgi.WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    server.serve_forever()