var fs = require('fs');
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var db = require('../db');

/* Web Service Body */

router.route('/posts').get(function(req, res, next) {

    // Sorting
    var sort = req.query.sort;
    var sortArray = [];
    var sortParams = [];
    if (typeof sort !== 'undefined') {
        // TODO: prevent injection
        sortArray = JSON.parse(sort);
        for (var i = 0; i < sortArray.length; i ++) {
            sortParams.push('BY');
            sortParams.push('*->' + sortArray[i].field);
            if (sortArray[i].isAlpha === true) sortParams.push('ALPHA');
            sortParams.push(sortArray[i].order);
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
        'comments'
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
    var queryParams = ['post'];
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
    })
});

module.exports = router;
