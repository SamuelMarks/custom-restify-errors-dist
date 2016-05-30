"use strict";
var restify_1 = require('restify');
var util_1 = require('util');
function fmtError(error, statusCode) {
    if (statusCode === void 0) { statusCode = 400; }
    if (!error)
        return null;
    else if (error.originalError) {
        if (!process.env['NO_DEBUG'])
            console.error(error);
        error = error.originalError;
    }
    if (error instanceof restify_1.RestError)
        return error;
    else if (error.invalidAttributes || error.hasOwnProperty('internalQuery'))
        return new WaterlineError(error, statusCode);
    else if (['status', 'text', 'method', 'path'].map(function (k) { return error.hasOwnProperty(k); }).filter(function (v) { return v; }).length === Object.keys(error).length)
        return new IncomingMessageError(error);
    else {
        Object.keys(error).map(function (k) { return console.log(k, '=', error[k]); });
        throw TypeError('Unhandled input to fmtError:' + error);
    }
}
exports.fmtError = fmtError;
exports.to_end = function (res) {
    return {
        NotFound: function (entity) {
            if (entity === void 0) { entity = 'Entity'; }
            return res.json(404, {
                error: 'NotFound', error_message: entity + " not found"
            });
        }
    };
};
function NotFoundError(entity) {
    if (entity === void 0) { entity = 'Entity'; }
    this.name = 'NotFoundError';
    var msg = entity + " not found";
    restify_1.RestError.call(this, {
        restCode: this.name,
        statusCode: 404,
        message: msg,
        constructorOpt: NotFoundError,
        body: {
            error: this.name,
            error_message: msg
        }
    });
}
exports.NotFoundError = NotFoundError;
util_1.inherits(NotFoundError, restify_1.RestError);
function WaterlineError(wl_error, statusCode) {
    if (statusCode === void 0) { statusCode = 400; }
    this.name = 'WaterlineError';
    restify_1.RestError.call(this, {
        message: wl_error.reason || wl_error.detail,
        statusCode: statusCode,
        constructorOpt: WaterlineError,
        restCode: this.name,
        body: Object.assign({
            error: {
                23505: 'unique_violation'
            }[wl_error.code],
            error_message: wl_error.reason || wl_error.detail
        }, (function (o) { return Object.keys(o.error_metadata).length > 0 ? o : {}; })({
            error_metadata: Object.assign({}, wl_error.invalidAttributes ? { invalidAttributes: wl_error.invalidAttributes } : {}, wl_error.details ? { details: wl_error.details.split('\n') } : {})
        }))
    });
}
exports.WaterlineError = WaterlineError;
util_1.inherits(WaterlineError, restify_1.RestError);
function IncomingMessageError(error) {
    this.name = 'IncomingMessageError';
    var error_title = error.status + " " + error.method + " " + error.path;
    restify_1.RestError.call(this, {
        message: error_title + " " + error.text,
        statusCode: 500,
        constructorOpt: IncomingMessageError,
        restCode: this.name,
        body: {
            error: error_title,
            error_message: error.text
        }
    });
}
exports.IncomingMessageError = IncomingMessageError;
util_1.inherits(IncomingMessageError, restify_1.RestError);
