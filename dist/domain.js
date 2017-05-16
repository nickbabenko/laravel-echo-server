"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var subscribers_1 = require("./subscribers");
var channels_1 = require("./channels");
var server_1 = require("./server");
var api_1 = require("./api");
var log_1 = require("./log");
var Domain = (function () {
    function Domain(options) {
        this.options = options;
        this.server = new server_1.Server(options);
    }
    Domain.prototype.setup = function () {
        var _this = this;
        return new Promise(function (accept, reject) {
            _this.server.init().then(function (io) {
                _this.init(io).then(function () {
                    log_1.Log.info('\nServer ready!\n');
                    accept();
                }, function (error) { return log_1.Log.error(error); });
            }, function (error) { return log_1.Log.error(error); });
        });
    };
    Domain.prototype.init = function (io) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.channel = new channels_1.Channel(io, _this.options);
            _this.redisSub = new subscribers_1.RedisSubscriber(_this.options);
            _this.httpSub = new subscribers_1.HttpSubscriber(_this.server.express, _this.options);
            _this.httpApi = new api_1.HttpApi(io, _this.channel, _this.server.express);
            _this.httpApi.init();
            _this.onConnect();
            _this.listen().then(function () { return resolve(); });
        });
    };
    Domain.prototype.listen = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var http = _this.httpSub.subscribe(function (channel, message) {
                return _this.broadcast(channel, message);
            });
            var redis = _this.redisSub.subscribe(function (channel, message) {
                return _this.broadcast(channel, message);
            });
            Promise.all([http, redis]).then(function () { return resolve(); });
        });
    };
    Domain.prototype.find = function (socket_id) {
        return this.server.io.sockets.connected[socket_id];
    };
    Domain.prototype.broadcast = function (channel, message) {
        if (message.socket && this.find(message.socket)) {
            return this.toOthers(this.find(message.socket), channel, message);
        }
        else {
            return this.toAll(channel, message);
        }
    };
    Domain.prototype.toOthers = function (socket, channel, message) {
        socket.broadcast.to(channel)
            .emit(message.event, channel, message.data);
        return true;
    };
    Domain.prototype.toAll = function (channel, message) {
        this.server.io.to(channel)
            .emit(message.event, channel, message.data);
        return true;
    };
    Domain.prototype.onConnect = function () {
        var _this = this;
        this.server.io.on('connection', function (socket) {
            _this.onSubscribe(socket);
            _this.onUnsubscribe(socket);
            _this.onDisconnecting(socket);
            _this.onClientEvent(socket);
        });
    };
    Domain.prototype.onSubscribe = function (socket) {
        var _this = this;
        socket.on('subscribe', function (data) {
            _this.channel.join(socket, data);
        });
    };
    Domain.prototype.onUnsubscribe = function (socket) {
        var _this = this;
        socket.on('unsubscribe', function (data) {
            _this.channel.leave(socket, data.channel, 'unsubscribed');
        });
    };
    Domain.prototype.onDisconnecting = function (socket) {
        var _this = this;
        socket.on('disconnecting', function (reason) {
            Object.keys(socket.rooms).forEach(function (room) {
                if (room !== socket.id) {
                    _this.channel.leave(socket, room, reason);
                }
            });
        });
    };
    Domain.prototype.onClientEvent = function (socket) {
        var _this = this;
        socket.on('client event', function (data) {
            _this.channel.clientEvent(socket, data);
        });
    };
    return Domain;
}());
exports.Domain = Domain;
