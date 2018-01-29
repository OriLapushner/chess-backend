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
	chessManager = require('./chessManager.js')

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
		// var url = 'mongodb://itsikben:itsikben@ds135917.mlab.com:35917/instadb';
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

// GETs a list
app.get('/data/:objType', function (req, res) {
	const objType = req.params.objType;
	dbConnect().then(db => {
		const collection = db.collection(objType);

		collection.find({}).toArray((err, objs) => {
			if (err) {
				cl('Cannot get you a list of ', err)
				res.json(404, { error: 'not found' })
			} else {
				cl("Returning list of " + objs.length + " " + objType + "s");
				res.json(objs);
			}
			db.close();
		});
	});
});


// GETs a single
app.get('/data/:objType/:id', function (req, res) {
	const objType = req.params.objType;
	const objId = req.params.id;
	cl(`Getting you an ${objType} with id: ${objId}`);
	dbConnect()
		.then((db) => {
			const collection = db.collection(objType);
			let _id;
			try {
				_id = new mongodb.ObjectID(objId);
			}
			catch (e) {
				return Promise.reject(e);
			}
			return collection.findOne({ _id: _id })
				.then((obj) => {
					cl("Returning a single" + objType);
					res.json(obj);
					db.close();
				})
				.catch(err => {
					cl('Cannot get you that ', err)
					res.json(404, { error: 'not found' })
					db.close();
				})

		});
});


// DELETE
app.delete('/data/:objType/:id', function (req, res) {
	const objType = req.params.objType;
	const objId = req.params.id;
	cl(`Requested to DELETE the ${objType} with id: ${objId}`);
	dbConnect().then((db) => {
		const collection = db.collection(objType);
		collection.deleteOne({ _id: new mongodb.ObjectID(objId) }, (err, result) => {
			if (err) {
				cl('Cannot Delete', err)
				res.json(500, { error: 'Delete failed' })
			} else {
				cl("Deleted", result);
				res.json({});
			}
			db.close();
		});

	});


});
app.post('/data/:userId/liked/:carId', function (req, res) {
	const userId = new mongodb.ObjectID(req.params.userId);
	const carId = new mongodb.ObjectID(req.params.carId);

	dbConnect().then((db) => {
		db.collection('user').findOne({ _id: userId }, (err, user) => {
			if (!user.likedCarIds) user.likedCarIds = [];
			// TODO: support toggle by checking if car already exist
			var isLikedIndex = user.likedCarIds.findIndex(currCarId => currCarId.equals(carId))
			console.log("isLikedIndex", isLikedIndex);
			if (isLikedIndex === -1) {
				user.likedCarIds.push(carId);
			} else {
				user.likedCarIds = user.likedCarIds.splice(isLikedIndex, 1);
			}

			db.collection('user').updateOne({ _id: userId }, user, (err, data) => {
				if (err) {
					cl(`Couldnt ADD LIKE`, err)
					res.json(500, { error: 'Failed to add' })
				} else {
					cl("Like updated");
					res.end()
				}
				db.close();
			})
		})
	});
});


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




//OUR CODE@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@



// app.post('/signup', function (req, res) {
// 	console.log(req.body)
// 	dbConnect().then((db) => {
// 		db.collection('user').insertOne(req.body, function (err, res) {
// 			if (!err) {
// 				cl('signup succesful');

// 			} else {
// 				cl('Signup NOT Succesful');
// 				res.json(403, { error: 'Signup failed' })
// 			}
// 			db.close();
// 		});
// 	});
// });

function ListenToPostDb(url, collection) {
	app.post(url, function (req, res) {

		dbConnect().then(function (db) {
			var currCollection = db.collection(collection)
			currCollection.insertOne(req.body, function (err, result) {
				if (!err) {
					cl(url + ' succesful');
					if (url === '/addStory') {
						console.log('executed story posting on mongo')
						var story = req.body
						story._id = result.insertedId
						io.emit('sendNewPost', story);
					}
				} else {
					cl(url + ' NOT Succesful');
					res.json(403, { error: url + 'failed' })
				}
				db.close();
			});
		});
	});
}
ListenToPostDb('/signup', 'user')
ListenToPostDb('/addStory', 'story')



var playerQued = null
io.on('connection', function (socket) {
	console.log('user has connected');
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
	socket.on('searchGame', function () {
		console.log('search game was initiated')
		if (playerQued !== null) {
			var gameId = chessManager.startGame(playerQued, socket.id)
			socket.broadcast.to(playerQued).emit('gameFound', { color: 'black', gameId });
			socket.emit('gameFound', { color: 'white', gameId });
			playerQued = null
		}
		else {
			playerQued = socket.id
		}
	})
	socket.on('movePiece', function (moveInfo) {
		var updateDestination = chessManager.movePiece(moveInfo)
		socket.broadcast.to(updateDestination).emit('updateBoard', moveInfo);

		
		
	})

})

cl('WebSocket is Ready on port: ' + port);
