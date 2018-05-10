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


app.use(express.static('public'));

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(clientSessions({
	cookieName: 'session',
	secret: 'ASDIsadi391243mxcvasdpoqxcvleus waiqpe933.x', //random string
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}));

const http = require('http').Server(app);
const io = require('socket.io')(http);


function dbConnect() {
	return new Promise((resolve, reject) => {
		// Connection URL
		var url = 'mongodb://Ori:123456@ds213118.mlab.com:13118/chessmastersdb';
		// Use connect method to connect to the Server
		mongodb.MongoClient.connect(url, function (err, db) {
			if (err) {
				cl('Cannot connect to DB', err)
				reject(err);
			}
			else {
				cl("Connected to DB");
				resolve(db);
			}
		});
	});
}



// Basic Login
app.post('/login', function (req, res) {
	console.log(req.body)
	dbConnect().then((db) => {
		db.collection('users').findOne({ username: req.body.username, pass: req.body.pass }, function (err, user) {
			if (user) {
				console.log(user ,' has connected')
				res.status(200).json(user)
			}
			else{
				console.log('login failed')
				res.status(400).json({error: 'login failed'})
			}
	});
});
})

//logout
app.get('/logout', function (req, res) {
	req.session.reset();
	res.end('Loggedout');
});




http.listen(port, function () {
	console.log(`misterREST server is ready at ${baseUrl}`);
	console.log(`GET (list): \t\t ${baseUrl}/{entity}`);
	console.log(`GET (single): \t\t ${baseUrl}/{entity}/{id}`);
	console.log(`DELETE: \t\t ${baseUrl}/{entity}/{id}`);
	console.log(`PUT (update): \t\t ${baseUrl}/{entity}/{id}`);
	console.log(`POST (add): \t\t ${baseUrl}/{entity}`);

});



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
