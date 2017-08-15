"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const restify_errors_1 = require("restify-errors");
exports.GenericError = function (args) {
    this.name = args.name || args.error;
    return restify_errors_1.RestError.call(this, {
        restCode: this.name,
        statusCode: args.statusCode,
        message: `${args.error}: ${args.error_message}`,
        constructorOpt: exports.GenericError,
        body: {
            error: args.error,
            error_message: args.error_message
        }
    });
};
util_1.inherits(exports.GenericError, restify_errors_1.RestError);
exports.AuthError = function (msg = '', statusCode = 401) {
    this.name = 'AuthError';
    restify_errors_1.RestError.call(this, {
        restCode: this.name,
        statusCode,
        message: msg,
        constructorOpt: exports.AuthError,
        body: {
            error: this.name,
            error_message: msg
        }
    });
};
util_1.inherits(exports.AuthError, restify_errors_1.RestError);
exports.NotFoundError = function (entity = 'Entity', msg = `${entity} not found`) {
    this.name = 'NotFoundError';
    restify_errors_1.RestError.call(this, {
        restCode: this.name,
        statusCode: 404,
        message: msg,
        constructorOpt: exports.NotFoundError,
        body: {
            error: this.name,
            error_message: msg
        }
    });
};
util_1.inherits(exports.NotFoundError, restify_errors_1.RestError);
exports.WaterlineError = function (wl_error, statusCode = 400) {
    this.name = 'WaterlineError';
    const msg = wl_error.detail !== undefined ?
        wl_error.detail : wl_error.reason !== undefined && [
        'Encountered an unexpected error', '1 attribute is invalid'
    ].indexOf(wl_error.reason) < -1 ?
        wl_error.reason : wl_error.message;
    /* TODO: populate with http://www.postgresql.org/docs/9.5/static/errcodes-appendix.html
     *  Or use https://raw.githubusercontent.com/ericmj/postgrex/v0.11.1/lib/postgrex/errcodes.txt
     */
    restify_errors_1.RestError.call(this, {
        message: msg,
        statusCode,
        constructorOpt: exports.WaterlineError,
        restCode: this.name,
        body: Object.assign({
            error: ({
                23505: 'unique_violation',
                E_UNIQUE: 'unique_violation'
            }[wl_error.code]) || wl_error.code,
            error_code: wl_error.code,
            error_message: msg
        }, ((o) => Object.keys(o.error_metadata).length > 0 ? o : {})({
            error_metadata: Object.assign({}, wl_error.invalidAttributes
                && (Object.keys(wl_error.invalidAttributes).length !== 1
                    || ['{"0":[]}', '[null]'].indexOf(JSON.stringify(wl_error.invalidAttributes)) < -1)
                ? { invalidAttributes: wl_error.invalidAttributes } : {}, wl_error.details && wl_error.details !== 'Invalid attributes sent to undefined:\n \u2022 0\n'
                ? { details: wl_error.details.split('\n') } : {})
        }))
    } // ICustomError
    );
};
util_1.inherits(exports.WaterlineError, restify_errors_1.RestError);
exports.IncomingMessageError = function (error) {
    this.name = 'IncomingMessageError';
    const error_title = `${error.status} ${error.method} ${error.path}`;
    restify_errors_1.RestError.call(this, {
        message: `${error_title} ${error.text}`,
        statusCode: 500,
        constructorOpt: exports.IncomingMessageError,
        restCode: this.name,
        body: {
            error: error_title,
            error_message: error.text
        }
    });
};
util_1.inherits(exports.IncomingMessageError, restify_errors_1.RestError);
exports.TypeOrmError = function (error) {
    this.name = 'TypeOrmError';
    restify_errors_1.RestError.call(this, {
        restCode: this.name,
        statusCode: 400,
        message: error.message,
        constructorOpt: exports.TypeOrmError,
        body: {
            error: this.name,
            error_message: error.message
        }
    });
};
util_1.inherits(exports.TypeOrmError, restify_errors_1.RestError);
exports.fmtError = (error, statusCode = 400) => {
    if (error == null)
        return null;
    else if (error.originalError != null) {
        if (process.env['NO_DEBUG'] != null)
            console.error(error);
        error = error.originalError;
    }
    if (error instanceof restify_errors_1.RestError)
        return error;
    else if (error.invalidAttributes != null || error.hasOwnProperty('internalQuery'))
        return new exports.GenericError({
            name: 'WLError',
            error,
            error_message: error,
            statusCode
        });
    else if (Object.getOwnPropertyNames(error).indexOf('stack') > -1 && error.stack.toString().indexOf('typeorm') > -1)
        return new exports.TypeOrmError(error);
    else if (['status', 'text', 'method', 'path'].map(k => error.hasOwnProperty(k)).filter(v => v).length === Object.keys(error).length)
        return new exports.IncomingMessageError(error);
    else {
        Object.keys(error).map(k => console.error(`error.${k} =`, error[k]));
        if (error instanceof Error)
            return new exports.GenericError({
                name: error.name,
                error: `${error.name}::${error.message}`,
                error_message: error.message,
                statusCode: 500
            });
        throw TypeError('Unhandled input to fmtError:' + error);
    }
};
exports.restCatch = (req, res, next) => (err) => {
    if (err != null)
        return next(exports.fmtError(err));
    res.json(200, req.body);
    return next();
};
