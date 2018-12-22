// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const server = require('../server');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const rewire = require('rewire');
const jwt = require("jsonwebtoken");
chai.use(chaiAsPromised);
chai.use(sinonChai);

var mongoose = require('mongoose');
var User = rewire('../models/User');

var UserController = rewire('../controllers/UserController');
var sandbox = sinon.sandbox.create();

describe('User Controller', ()=> {

	let req;
	let userToLogin;
	let jwt;

    beforeEach(function() {
		userToLogin = {
			comparePassword: sandbox.stub().resolves(false)
		};

		req = { 
			body:{
				'email': 'foo@bar.com', 
				'password': 'feawfe' 
			}
		};

    	res = {
	      status: (code) => {
	        return {
	          json: (response) => {
	            return { status: code, response: response };
	          }
	        }
	      }
	    };

	    let jwtMock = {
	    	sign:function(){
	    		return 'faeae';
	    	}
	    }

UserController.__set__('jwt',jwtMock)
    });

    afterEach(() => {
		sandbox.restore();
	});

	context('POST /token', ()=> {
		it('should return bad credentials error after user not found', async () => {
		
        	sandbox.stub(User, 'findOne').resolves(false);
	        let result = await UserController.login(req, res);
			expect(result.status).to.equal(401);
    		expect(result.response).to.have.property('message').to.equal('Bad credentials. User not found.');
		});

		it('should return bad credentials error after incorrect password', async () => {

        	sandbox.stub(User, 'findOne').resolves(userToLogin);
	        let result = await UserController.login(req, res);
			expect(result.status).to.equal(401);
    		expect(result.response).to.have.property('message').to.equal('Bad credentials. User not found.');
		});

		it('should return user id and token on authentication', async () => {

			userToLogin = {
				_id:1,
				email:'foo@bar.gmail.com',
				firstName:'foo',
				lastName:'bar',
				token:'faeae',
				comparePassword: sandbox.stub().resolves(true)
			};

	    	res = {
		      json: (response) => {
	            return { response: response };
		      }
		    };
        	sandbox.stub(User, 'findOne').resolves(userToLogin);
	        let result = await UserController.login(req, res);
    		expect(result.response).to.have.property('userid').to.equal(userToLogin._id);
    		expect(result.response).to.have.property('token').to.equal(userToLogin.token);
		});

		// it('should throw an exception if an issue occurs', async () => {

		// 	let spy = sinon.spy();
		// 	userToLogin = {
		// 		_id:null,
		// 		email:'foo@bar.gmail.com',
		// 		firstName:'foo',
		// 		lastName:'bar',
		// 		token:'faeae',
		// 		comparePassword: sandbox.stub().throws('randomError')
		// 	};

		// 	res = {
		// 		status: (code) => {
		// 			return {
		// 				send: (error) => {
		// 					return { status: code, response: response };
		// 				}
		// 			}
		// 		}
		// 	};

  //       	sandbox.stub(User, 'findOne').resolves(userToLogin);
	 //        let result = await UserController.login(req, res);
		// 	expect(result.status).to.equal(400);
  //       	expect(spy.calledOnce).to.equal(true);
		// });
	});


})