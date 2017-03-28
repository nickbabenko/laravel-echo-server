"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require('request');
var log_1 = require("./../log");
var PrivateChannel = (function () {
    function PrivateChannel(options) {
        this.options = options;
        this.request = request;
    }
    PrivateChannel.prototype.authenticate = function (socket, data) {
        var options = {
            url: this.authHost() + this.options.authEndpoint,
            form: { channel_name: data.channel },
            headers: (data.auth && data.auth.headers) ? data.auth.headers : {},
            rejectUnauthorized: false
        };
        return this.serverRequest(socket, options);
    };
    PrivateChannel.prototype.authHost = function () {
        return (this.options.authHost) ?
            this.options.authHost : this.options.host;
    };
    PrivateChannel.prototype.serverRequest = function (socket, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            options.headers = _this.prepareHeaders(socket, options);
            var body;
            _this.request.post(options, function (error, response, body, next) {
                if (error) {
                    if (_this.options.devMode) {
                        log_1.Log.error("[" + new Date().toLocaleTimeString() + "] - Error authenticating " + socket.id + " for " + options.form.channel_name);
                    }
                    log_1.Log.error(error);
                    reject({ reason: 'Error sending authentication request.', status: 0 });
                }
                else if (response.statusCode !== 200) {
                    if (_this.options.devMode) {
                        log_1.Log.warning("[" + new Date().toLocaleTimeString() + "] - " + socket.id + " could not be authenticated to " + options.form.channel_name);
                        log_1.Log.error(response.body);
                    }
                    reject({ reason: 'Client can not be authenticated, got HTTP status ' + response.statusCode, status: response.statusCode });
                }
                else {
                    if (_this.options.devMode) {
                        log_1.Log.info("[" + new Date().toLocaleTimeString() + "] - " + socket.id + " authenticated for: " + options.form.channel_name);
                    }
                    try {
                        body = JSON.parse(response.body);
                    }
                    catch (e) {
                        body = response.body;
                    }
                    resolve(body);
                }
            });
        });
    };
    PrivateChannel.prototype.prepareHeaders = function (socket, options) {
        options.headers['Cookie'] = socket.request.headers.cookie;
        options.headers['X-Requested-With'] = 'XMLHttpRequest';
        return options.headers;
    };
    return PrivateChannel;
}());
exports.PrivateChannel = PrivateChannel;