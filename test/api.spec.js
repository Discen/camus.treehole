/**
 * Created by guangchen on 10/26/14.
 */
'use strict';

var app = require('../app');
var request = require('supertest');
var db = require('../config/db');
var id = '';

describe('Test API', function() {
  before(function (done) {
    db.connect(function(err, client){
      var conn = db.db();
      var collection = conn.collection('holes');
      collection.insert([{'title': 'test hole'}, {'title': 'test 2'}], function(err, result) {
        if(!err) {
          done();
        } else {
          console.log(err, result);
        }
      });
    });
  });

  after(function (done) {
    var conn = db.db();
    var collection = conn.collection('holes');
    collection.drop(done);
  });

  describe('GET /api/v1/status', function() {
    it('should return ok', function(done) {
      request(app)
        .get('/api/v1/status')
        .expect(200)
        .expect('OK', done);
    });
  });

  describe('GET /api/v1/holes', function() {
    it('should get tree-hole lists', function(done) {
      request(app)
        .get('/api/v1/holes')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(function(res) {
          res.body.should.with.length(2);
        })
        .end(done);
    });
  });

  describe('POST /api/v1/holes', function() {
    it('should create tree-hole and returns id', function(done) {
      request(app)
        .post('/api/v1/holes')
        .send({
          "title": "Test"
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .expect(function(res) {
          res.body.should.have.property('_id');
          res.body.should.have.property('title', 'Test');
          id = res.body._id;
        })
        .end(done);
    });
  });

  describe('GET /api/v1/holes/:id', function() {
    it('should get a tree-hole', function(done) {
      request(app)
        .get('/api/v1/holes/' + id)
        .expect(200)
        .expect(function(res) {
          res.body.should.have.property('title', 'Test');
        })
        .end(done);
    });
  });
});
