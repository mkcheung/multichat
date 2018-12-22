// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const server = require('../server');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const rewire = require('rewire');
chai.use(chaiAsPromised);
chai.use(sinonChai);

var mongoose = require('mongoose');
var User = rewire('../models/User');

var UserController = require('../controllers/UserController');
var sandbox = sinon.sandbox.create();

describe('User Controller', ()=> {

	let req;
	let res;
	let userFindResult;

    beforeEach(function() {
		userFindResult = {
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

        	sandbox.stub(User, 'findOne').resolves(userFindResult);
	        let result = await UserController.login(req, res);
			expect(result.status).to.equal(401);
    		expect(result.response).to.have.property('message').to.equal('Bad credentials. User not found.');
		});
	});


})