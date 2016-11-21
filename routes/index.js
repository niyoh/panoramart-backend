var fs = require('fs');
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var db = require('../db');

/* Web Service Body */

// List Bids
router.route('/bids').get(function(req, res, next) {
    var fields = [
      "productName",
      "productCategory",
      "supplierName",
      "quantity",
      "unitPrice",
      "slottingFee",
      "productDescription"
    ]
    var fieldParams = [];
    for (var i in fields) {
        fieldParams.push("GET");
        fieldParams.push("*->" + fields[i]);
    }
    db.get().sort('cost', 'BY', 'nosort', fieldParams, function(err, result) {
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

// Place Bid
router.route('/bid').post(function(req, res, next) {
    var productName = req.body.productName;
    var supplierName = req.body.supplierName;
    var unitPrice = req.body.unitPrice;
    var slottingFee = req.body.slottingFee;
    var productDescription = req.body.productDescription;
    var quantity = req.body.quantity;
    var productCategory = req.body.productCategory;

    var dataSet = [
        'productName', productName,
        'supplierName', supplierName,
        'unitPrice', unitPrice,
        'slottingFee', slottingFee,
        'productDescription', productDescription,
        'quantity', quantity,
        'productCategory', productCategory
    ];

    // get latest bid #
    db.get().incr('id', function(err, result) {
        var id = result;

        // create a bid
        db.get().hmset('bid:' + id, dataSet, function(err, result) {

            // calculate total cost
            var cost = unitPrice * quantity - slottingFee;

            db.get().zadd('cost', cost, 'bid:' + id, function(err, result) {
                res.send({
                    'result': 'success'
                });
            })
        });
    });

});

module.exports = router;
