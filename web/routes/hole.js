'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var async = require('async');
var restRequest = require('../helper/rest-request');
var error = require('../../common/helper/error');
var upyun = require('../helper/upyun');

router.post('/', function (req, res, next) {
  var textContent = req.param('txtContent');
  if (textContent.length === 0) {
    return next(error('Empty Content', {status: 400}));
  }
  var hole = {};
  hole.author = req.session.user;
  hole.text = textContent;
  hole.anonymous = (req.param('anonymous') === 'on');
  hole.feedbacks = req.param('feedbacks');
  if (!Array.isArray(hole.feedbacks)) {
    hole.feedbacks = [hole.feedbacks];
  }
  hole.images = req.param('images');
  if (hole.images && !Array.isArray(hole.images)) {
    hole.images = [hole.images];
  }
  hole.channel = "testChannel";
  restRequest.use('treehole').post('/holes', hole, next)
    .success(function () {
      res.redirect('/');
    });
});

router.get('/:id', function (req, res, next) {
  async.parallel([
    // retrieve treehole
    function (callback) {
      restRequest.use('treehole').get('/holes/' + req.param('id'), callback)
        .success(function (hole) {
          hole.images = _.map(hole.images, function (imageId) {
            return upyun.getShowUrl(imageId);
          });
          callback(null, hole);
        })
        .fail(function () {
          callback(error('Not Found', {status: 404}));
        });
    },

    // retrieve comments
    function (callback) {
      restRequest.use('treehole').get('/holes/' + req.param('id') + '/comments', callback)
        .success(function (comments) {
          callback(null, comments);
        })
        .fail(function () {
          callback(error('Not Found', {status: 404}));
        });
    }

  ], function (err, result) {
    if (err) {
      return next(err);
    }
    res.render('hole/show', {
      treehole: result[0],
      comments: result[1]
    });
  });
});

router.post('/:id/comment', function (req, res, next) {
  var holeId = req.param('id');
  var text = req.param('comment-text');
  if (text.length === 0) {
    return next(error('Empty Content', {status: 400}));
  }
  var params = {
    from_user: req.session.user,
    hole_id: holeId,
    text: text,
    anonymous: (req.param('anonymous') === 'on')
  };
  restRequest.use('treehole').post('/holes/' + holeId + '/comments', params, next)
    .success(function () {
      res.redirect('/hole/' + holeId);
    });
});

router.post('/:hole_id/feedbacks/:feedback_id', function (req, res, next) {
  restRequest.use('treehole').post('/holes/' + req.param('hole_id') + '/feedbacks/' + req.param('feedback_id'),
    {action: req.param('action'), user: req.session.user}, next)
    .success(function (result) {
      res.send(result);
    });
});

module.exports = router;
