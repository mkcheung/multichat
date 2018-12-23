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

	context('POST /users', ()=> {
		let FakeUserClass, saveStub, result, req, res, sampleNewUser;

		beforeEach( async ()=>{

			sampleNewUser = { 
				'email':'foo@bar.gmail.com',
				'firstName':'foo',
				'lastName':'bar',
				'password': '123456789a'
			};
			req = { 
				body:sampleNewUser
			};

			res = {
				json: (response) => {
					return { response: response };
				}
			};

		    let mockHashSync = {
		    	hashSync:function(){
		    		return '123456789a';
		    	}
		    }

			UserController.__set__('bcrypt', mockHashSync)
			saveStub = sandbox.stub().resolves(sampleNewUser);
			FakeUserClass = sandbox.stub().returns({save:saveStub});
			UserController.__set__('User', FakeUserClass);
			result = await UserController.register(req, res);
		});

	    afterEach(() => {
			sandbox.restore();
			UserController = rewire('../controllers/UserController');
		});

		it('should call User with new', async () => {
		
			expect(FakeUserClass).to.have.been.calledWithNew;
		});

		it('should save the user', () =>{

			expect(saveStub).to.have.been.called;
		});

		it('should save and return expected properties', () =>{

    		expect(result.response).to.have.property('email').to.equal('foo@bar.gmail.com');
    		expect(result.response).to.have.property('firstName').to.equal('foo');
    		expect(result.response).to.have.property('lastName').to.equal('bar');
    		expect(result.response).to.have.property('password').to.equal('123456789a');
		});
	});

	context('POST /token', ()=> {

		let req;
		let userToLogin;
		let jwt;
		let bcrypt;

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
	});

	context('GET /users', ()=> {

		let req;
		let res;
		let nextSpy;

		beforeEach(() =>{

	    	res = {
		      status: (code) => {
		        return {
		          json: (response) => {
		            return { status: code, response: response };
		          }
		        }
		      }
		    };

			nextSpy = sinon.spy();
		});

	    afterEach(() => {
			sandbox.restore();
			UserController = rewire('../controllers/UserController');
		});

		it('should request a login if not so already', async () => {

			req = { 
				user:false
			};

	        let result = await UserController.loginRequired(req, res, nextSpy);
			expect(result.status).to.equal(401);
    		expect(result.response).to.have.property('message').to.equal('Please log in.');
		});

		it('should proceed if user is already logged in', async () => {

			req = { 
				user:true
			};

	        let result = await UserController.loginRequired(req, res, nextSpy);
	        expect(nextSpy.calledOnce).to.be.true;
		});

		it('should fail getting all users if jwt verification fails', async () => {

		    let jwtMock = {
		    	verify:function(){
		    		return false;
		    	}
		    }

			req = { 
				headers:{
					authorization:{
						split:function(){
							return ['1', true];
						}
					}
				}
			};

			UserController.__set__('jwt',jwtMock)

	        let result = await UserController.getAllUsers(req, res);
			expect(result.status).to.equal(401);
    		expect(result.response).to.have.property('message').to.equal('Authorization required.');
		});

		it('should fail getting all users if there are none', async () => {

		    let jwtMock = {
		    	verify:function(){
		    		return true;
		    	}
		    }

			req = { 
				headers:{
					authorization:{
						split:function(){
							return ['1', true];
						}
					}
				}
			};

        	sandbox.stub(User, 'find').resolves(false);
			UserController.__set__('jwt',jwtMock)

	        let result = await UserController.getAllUsers(req, res);
			expect(result.status).to.equal(401);
    		expect(result.response).to.have.property('message').to.equal('No users.');
		});

		it('should return users', async () => {

		    let jwtMock = {
		    	verify:function(){
		    		return true;
		    	}
		    }

			req = { 
				headers:{
					authorization:{
						split:function(){
							return ['1', true];
						}
					}
				}
			};

			let resJsonSpy = sinon.spy();
			res = { 
				json:resJsonSpy
			};

        	sandbox.stub(User, 'find').resolves(true);
			UserController.__set__('jwt',jwtMock)

	        let result = await UserController.getAllUsers(req, res);
	        expect(resJsonSpy.calledOnce).to.be.true;
		});
	});
})