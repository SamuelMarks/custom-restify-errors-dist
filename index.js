"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify_errors = require("restify-errors");
const restify_errors_1 = require("restify-errors");
exports.GenericErrorBase = restify_errors.makeConstructor('GenericError', {
    statusCode: 400, failureType: 'GenericError'
});
class GenericError extends exports.GenericErrorBase {
    constructor(generic_error) {
        const name = generic_error.name == null ? 'GenericError' : generic_error.name;
        super(name);
        this.code = this.displayName = this.name = name;
        this.message = `${generic_error.name}: ${generic_error.message}`;
        this.statusCode = generic_error.statusCode || 400;
        this.cause = () => generic_error.cause;
        this.info = this.jse_info = this.body = Object.assign({
            code: this.code, error: this.name, error_message: generic_error.message
        }, this.hasOwnProperty('_meta') && this._meta ?
            { _meta: this._meta } : {});
        if (generic_error.info != null)
            this.jse_info = generic_error.info;
    }
    // HACK
    toJSON() {
        return this.jse_info;
    }
}
exports.GenericError = GenericError;
class AuthError extends GenericError {
    constructor(message, statusCode = 403, cause) {
        super({ name: 'AuthError', cause, message, statusCode });
    }
}
exports.AuthError = AuthError;
class NotFoundError extends GenericError {
    constructor(entity = 'Entity', message = `${entity} not found`, statusCode = 404, cause) {
        super({ name: 'NotFoundError', cause, message, statusCode });
    }
}
exports.NotFoundError = NotFoundError;
const body = {
    body: {
        error: 'this.name',
        error_message: ''
    }
};
class WaterlineError extends GenericError {
    constructor(cause, statusCode = 400) {
        super({
            name: 'WaterlineError', cause: cause,
            message: cause.detail !== undefined ?
                cause.detail : cause.reason !== undefined && [
                'Encountered an unexpected error', '1 attribute is invalid'
            ].indexOf(cause.reason) < -1 ?
                cause.reason : cause.message || '',
            statusCode
        });
    }
}
exports.WaterlineError = WaterlineError;
class IncomingMessageError extends GenericError {
    constructor(error, statusCode = 500) {
        super({
            name: 'IncomingMessageError',
            cause: error,
            message: `${error.statusCode} ${error.method} ${error.path}\n${JSON.stringify(error.headers)}`,
            statusCode
        });
        // error: `${error.statusCode} ${error.method} ${error.path}`
        // error_message: error.text
        // message: `${error_title} ${error.text}`,
    }
}
exports.IncomingMessageError = IncomingMessageError;
class TypeOrmError extends GenericError {
    constructor(cause, statusCode = 400) {
        super({ name: 'TypeOrmError', cause, message: cause.message, statusCode });
    }
}
exports.TypeOrmError = TypeOrmError;
exports.fmtError = (error, statusCode) => {
    if (error == null)
        return null;
    else if (error.originalError != null) {
        if (process.env['NO_DEBUG'] != null)
            console.error(error);
        error = error.originalError;
    }
    if (error instanceof restify_errors_1.RestError)
        return error;
    else if (error.hasOwnProperty('_e') && error._e.stack && error._e.stack.indexOf('WLError') > -1)
        return new WaterlineError(error._e, statusCode);
    else if (Object.getOwnPropertyNames(error).indexOf('stack') > -1 && error.stack.toString().indexOf('typeorm') > -1)
        return new TypeOrmError(error);
    else if (['statusCode', 'path', 'method', 'headers']
        .map(k => error.hasOwnProperty(k))
        .filter(v => v)
        .length <= Object.keys(error).length)
        return new IncomingMessageError(error, error.statusCode);
    else {
        Object.keys(error).map(k => console.error(`error.${k} =`, error[k]));
        if (error instanceof Error)
            return new GenericError({
                name: error.name,
                cause: error,
                // error: `${error.name}::${error.message}`,
                message: error.message,
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
