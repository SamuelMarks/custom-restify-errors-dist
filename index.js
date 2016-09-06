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
        Object.keys(error).map(function (k) { return console.error(k, '=', error[k]); });
        throw TypeError('Unhandled input to fmtError:' + error);
    }
}
exports.fmtError = fmtError;
function GenericError(args) {
    this.name = args.name || args.error;
    restify_1.RestError.call(this, {
        restCode: this.name,
        statusCode: args.statusCode,
        message: args.error + ": " + args.error_message,
        constructorOpt: GenericError,
        body: {
            error: args.error,
            error_message: args.error_message
        }
    });
}
exports.GenericError = GenericError;
util_1.inherits(GenericError, restify_1.RestError);
function NotFoundError(entity, msg) {
    if (entity === void 0) { entity = 'Entity'; }
    if (msg === void 0) { msg = entity + " not found"; }
    this.name = 'NotFoundError';
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
    var msg = wl_error.detail !== undefined ?
        wl_error.detail : wl_error.reason !== undefined && [
        'Encountered an unexpected error', '1 attribute is invalid'].indexOf(wl_error.reason) < -1 ?
        wl_error.reason : wl_error.message;
    restify_1.RestError.call(this, {
        message: msg,
        statusCode: statusCode,
        constructorOpt: WaterlineError,
        restCode: this.name,
        body: Object.assign({
            error: {
                23505: 'unique_violation',
                E_UNIQUE: 'unique_violation'
            }[wl_error.code] || wl_error.code,
            error_code: wl_error.code,
            error_message: msg
        }, (function (o) { return Object.keys(o.error_metadata).length > 0 ? o : {}; })({
            error_metadata: Object.assign({}, wl_error.invalidAttributes
                && (Object.keys(wl_error.invalidAttributes).length !== 1
                    || ['{"0":[]}', '[null]'].indexOf(JSON.stringify(wl_error.invalidAttributes)) < -1)
                ? { invalidAttributes: wl_error.invalidAttributes } : {}, wl_error.details && wl_error.details !== 'Invalid attributes sent to undefined:\n \u2022 0\n'
                ? { details: wl_error.details.split('\n') } : {})
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
