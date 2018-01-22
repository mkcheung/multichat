var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  bodyParser = require('body-parser'),
  jwt = require("jsonwebtoken"),
  cors = require('cors'),
  http = require("http"),
  socketIo = require("socket.io"),
  socketEvents = require('./socketEvents'),
  mongoose = require('mongoose'); // needed to connect to the database

// load the specific model
require('./models/User'); 
require('./models/Channel'); 
require('./models/Message'); 

app.use(cors());

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
//set up the connection to the database
mongoose.connect('mongodb://kuanyin:ueshiba1883@ds127783.mlab.com:27783/mkcheungmongodb'); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// kick off the middleware to make sure we have the token within the header
app.use(function(req,res,next){
	if(req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT'){
		jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			if(err){
				req.user = undefined;
			}
			req.user = decode;
			next()
		});
	} else {
		req.user = undefined;
		next();
	}
});


// app.listen(port);

const routes = require('./routes/routes');
routes(app); //register the route


// // Run server to listen on port 3000.
// const server = app.listen(port, () => {
//   console.log('listening on *:3000');
// });
// const io = require('socket.io')(server);
// // Set socket.io listeners.
// io.on('connection', (socket) => {
//   console.log('a user connected');
 
//   socket.on('disconnect', () => {
//     console.log('user disconnected');
//   });
// });

// console.log('todo list RESTful API server started on: ' + port);

const server = http.createServer(app);
const io = socketIo(server);

io.on("connection", socket => {
  console.log("New client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

server.listen(port, () => console.log(`Listening on port ${port}`));

socketEvents(io);