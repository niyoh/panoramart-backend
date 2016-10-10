/**
 * Created by Martin on 10/9/16.
 */

var Redis = require("ioredis");

var state = {
    db: null
};

var MODE_TEST = "mode_test",
    MODE_PRODUCTION = "mode_production";

exports.MODE_TEST = MODE_TEST;
exports.MODE_PRODUCTION = MODE_PRODUCTION;

exports.connect = function(mode) {
    state.db = new Redis();

    // Use different DB when testing
    if (mode === MODE_TEST) {
        state.db.select(1)
    } else {
        state.db.select(0)
    }
};

exports.get = function() {
    return state.db
};