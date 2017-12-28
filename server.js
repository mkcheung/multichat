var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  bodyParser = require('body-parser'),
  jwt = require("jsonwebtoken"),
  mongoose = require('mongoose'); // needed to connect to the database

// load the specific model
require('./models/User'); 
require('./models/Channel'); 
require('./models/Message'); 

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
//set up the connection to the database
mongoose.connect('mongodb://localhost/multichat'); 
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


app.listen(port);

const routes = require('./routes/routes');
routes(app); //register the route

console.log('todo list RESTful API server started on: ' + port);