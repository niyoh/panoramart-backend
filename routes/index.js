var fs = require('fs');
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var db = require('../db');

/* Web Service Body */

router.route('/favorite').post(function(req, res, next) {
    var postId = 'post:' + req.body.postId;
    console.log(postId);
    db.get().zscan('favorites', 0, 'MATCH', postId, function(err, result) {
        if (result.length >= 2) {
            if (result[1].length >= 1) {
                // already favorited
                db.get().zrem('favorites', postId, function(err, result) {
                    res.send({
                        'favorite': 0
                    });
                });
            } else {
                // not favorited
                db.get().zadd('favorites', Math.floor(Date.now() / 1000), postId, function(err, result) {
                    res.send({
                        'favorite': 1
                    });
                });
            }
        }
    });
});

router.route('/posts').get(function(req, res, next) {
    var queryParams = ['chrono'];   // by default we use chronological order

    // Sorting
    var sort = req.query.sort;
    var sortArray = [];
    var sortParams = [];
    if (typeof sort !== 'undefined') {
        // TODO: prevent injection
        sortArray = JSON.parse(sort);
        for (var i = 0; i < sortArray.length; i ++) {

            // predefined indexes (applicable if only sorted by 1 field)
            if (sortArray.length === 1) {
                if (sortArray[i].field === 'date') {
                    queryParams = ['chrono'];
                    sortParams = ['BY', 'nosort', sortArray[i].order];
                } else if (sortArray[i].field === 'comments') {
                    queryParams = ['comments'];
                    sortParams = ['BY', 'nosort', sortArray[i].order];
                } else if (sortArray[i].field === 'likes') {
                    queryParams = ['likes'];
                    sortParams = ['BY', 'nosort', sortArray[i].order];
                } else if (sortArray[i].field === 'videos') {
                    queryParams = ['videos'];
                    sortParams = ['BY', 'nosort', sortArray[i].order];
                } else if (sortArray[i].field === 'favorites') {
                    queryParams = ['favorites'];
                    sortParams = ['BY', 'nosort', sortArray[i].order];
                }
            } else {
                // generic fields
                sortParams.push('BY');
                sortParams.push('*->' + sortArray[i].field);
                if (sortArray[i].isAlpha === true) sortParams.push('ALPHA');
                sortParams.push(sortArray[i].order);
            }
        }
    }

    // Fields
    var fields = [
        'id',
        'caption',
        'thumbnail_src',
        'display_src',
        'date',
        'likes',
        'comments',
        'is_video',
        'video_url'
    ];
    var fieldParams = [];
    for (var i in fields) {
        fieldParams.push('GET');
        fieldParams.push('*->' + fields[i]);
    }

    // Pagination
    var paginationParams = [];
    var maxResult = parseInt(req.query.maxResult);
    var firstResult = parseInt(req.query.firstResult);
    if (Number.isInteger(firstResult) && firstResult >= 0 &&
        Number.isInteger(maxResult) && maxResult > 0) {
        paginationParams = [
            'LIMIT',
            firstResult,
            maxResult
        ]
    } else {
        paginationParams = [
            'LIMIT',
            0,
            12
        ]
    }

    // Form Query
    queryParams = queryParams.concat(sortParams);
    queryParams = queryParams.concat(fieldParams);
    queryParams = queryParams.concat(paginationParams);

    db.get().sort(queryParams, function(err, result) {
        var posts = [];
        for (var i = 0; i < result.length / fields.length; i ++) {
            var post = {};
            for (var j = 0; j < fields.length; j ++) {
                post[fields[j]] = result[i * fields.length + j];
            }
            posts.push(post);
        }

        res.send(posts);
    });
});

module.exports = router;
