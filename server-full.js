// Minimal Simple REST API Handler (With MongoDB and Socket.io)
// Plus support for simple login and session
// Plus support for file upload
// Author: Yaron Biton misterBIT.co.il

"use strict";

var cl = console.log;

const express = require('express'),
	bodyParser = require('body-parser'),
	cors = require('cors'),
	mongodb = require('mongodb'),
	chessManager = require('./chessManager')

const clientSessions = require("client-sessions");
// const upload = require('./uploads');
const app = express();

var corsOptions = {
	origin: /http:\/\/localhost:\d+/,
	credentials: true
};

const serverRoot = 'http://localhost:3003/';
const baseUrl = serverRoot + 'data';

var port = process.env.PORT || 3003;

// app.use(express.static('uploads'));
app.use(express.static('dist'));

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(clientSessions({
	cookieName: 'session',
	secret: 'C0d1ng 1s fun 1f y0u kn0w h0w', // set this to a long random string!
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}));

const http = require('http').Server(app);
const io = require('socket.io')(http);


function dbConnect() {

	return new Promise((resolve, reject) => {
		// Connection URL
		// var url = 'mongodb://mlab.com:35917/instadb';
		var url = 'mongodb://localhost:27017/instaDb';
		// Use connect method to connect to the Server
		mongodb.MongoClient.connect(url, function (err, db) {
			if (err) {
				cl('Cannot connect to DB', err)
				reject(err);
			}
			else {
				//cl("Connected to DB");
				resolve(db);
			}
		});
	});
}



// Basic Login/Logout/Protected assets
app.post('/login', function (req, res) {
	console.log(req.body)
	dbConnect().then((db) => {
		db.collection('user').findOne({ username: req.body.username, pass: req.body.pass }, function (err, user) {
			if (user) {
				cl('Login Succesful');
				delete user.pass;
				req.session.user = user;
				console.log('sending user: ', user)
				res.json({ token: '', user });
				db.collection('story').find({}).toArray((err, objs) => {
					if (err) {
						cl('Cannot get you a list of ', err)
					} else {
						cl("Returning list of " + objs.length + " stories");
						io.emit('feedSend', objs);
					}
					db.close();
				});
			} else {
				cl('Login NOT Succesful');
				req.session.user = null;
				res.json(403, { error: 'Login failed' })
			}
		});
	});
});

app.get('/logout', function (req, res) {
	req.session.reset();
	res.end('Loggedout');
});

function requireLogin(req, res, next) {
	if (!req.session.user) {
		cl('Login Required');
		res.json(403, { error: 'Please Login' })
	} else {
		next();
	}
}

app.get('/protected', requireLogin, function (req, res) {
	res.end('User is loggedin, return some data');
});


// Kickup our server 
// Note: app.listen will not work with cors and the socket
// app.listen(3003, function () {
http.listen(port, function () {
	console.log(`misterREST server is ready at ${baseUrl}`);
	console.log(`GET (list): \t\t ${baseUrl}/{entity}`);
	console.log(`GET (single): \t\t ${baseUrl}/{entity}/{id}`);
	console.log(`DELETE: \t\t ${baseUrl}/{entity}/{id}`);
	console.log(`PUT (update): \t\t ${baseUrl}/{entity}/{id}`);
	console.log(`POST (add): \t\t ${baseUrl}/{entity}`);

});


// Some small time utility functions




// function cl(...params) {
// 	console.log.apply(console, params);
// }

// Just for basic testing the socket
// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/test-socket.html');
// });







app.post('/signup', function (req, res) {
	console.log(req.body)
	dbConnect().then((db) => {
		db.collection('users').insertOne(req.body, function (err, res) {
			if (!err) {
				cl('signup succesful');

			} else {
				cl('Signup NOT Succesful');
				res.json(403, { error: 'Signup failed' })
			}
			db.close();
		});
	});
});

var playerQued = null
io.on('connection', function (socket) {
	console.log('user has connected');
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
	socket.on('searchGame', function () {
		console.log('search game was initiated')
		if (playerQued !== null) {
			var gameId = chessManager.startGame(playerQued, socket)
			playerQued.emit('gameFound', { color: 'black', gameId });
			socket.emit('gameFound', { color: 'white', gameId });
			playerQued = null
		}
		else {
			playerQued = socket
		}
	})
	socket.on('movePiece', function (moveInfo) {
		var socketToUpdate = chessManager.movePiece(moveInfo)
		socketToUpdate.emit('updateBoard', moveInfo)
		// socket.emit('updateBoard',moveInfo)
	})
	socket.on('sendMsg', function (msgInfo) {
		var sockets = chessManager.getSockets(msgInfo.gameId)
		console.log('sending msg', msgInfo)
		// console.log('p1 session id:', bla.p1Socket)
		// console.log('p2 session id:', bla.p2Socket)
		sockets.p1.emit('forwardMsg', msgInfo )
		sockets.p2.emit('forwardMsg', msgInfo )
	})
})

cl('WebSocket is Ready on port: ' + port);
