"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var subscribers_1 = require("./subscribers");
var channels_1 = require("./channels");
var server_1 = require("./server");
var api_1 = require("./api");
var log_1 = require("./log");
var packageFile = require('../package.json');
var EchoServer = (function () {
    function EchoServer() {
        this.defaultOptions = {
            authHost: 'http://localhost',
            authEndpoint: '/broadcasting/auth',
            clients: [],
            database: 'redis',
            databaseConfig: {
                redis: {},
                sqlite: {
                    databasePath: '/database/laravel-echo-server.sqlite'
                }
            },
            devMode: false,
            host: null,
            port: 6001,
            protocol: "http",
            socketio: {},
            domains: [],
            sslCertPath: '',
            sslKeyPath: ''
        };
    }
    EchoServer.prototype.run = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.options = Object.assign(_this.defaultOptions, options);
            _this.startup();
            var count = 0;
            _this.options.domains.forEach(function (domain) {
                var options = Object.create(_this.options);
                if (typeof domain === 'object' &&
                    typeof domain.port === 'number' &&
                    typeof domain.domain === 'string') {
                    options.port = domain.port;
                    options.domain = domain.domain;
                }
                else if (typeof domain === 'string') {
                    options.domain = domain;
                }
                else {
                    throw 'Invalid domain configuration';
                }
                options.sslCertPath = _this.options.sslCertPath + domain + '.crt';
                options.sslKeyPath = _this.options.sslKeyPath + domain + '.key';
                _this.server = new server_1.Server(options);
                _this.server.init().then(function (io) {
                    _this.init(io).then(function () {
                        log_1.Log.info('\nServer ready!\n');
                        count++;
                        if (count === _this.options.domains.length) {
                            resolve();
                        }
                    }, function (error) { return log_1.Log.error(error); });
                }, function (error) { return log_1.Log.error(error); });
            });
        });
    };
    EchoServer.prototype.init = function (io) {
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
    EchoServer.prototype.startup = function () {
        log_1.Log.title("\nL A R A V E L  E C H O  S E R V E R\n");
        log_1.Log.info("version " + packageFile.version + "\n");
        if (this.options.devMode) {
            log_1.Log.warning('Starting server in DEV mode...\n');
        }
        else {
            log_1.Log.info('Starting server...\n');
        }
    };
    EchoServer.prototype.listen = function () {
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
    EchoServer.prototype.find = function (socket_id) {
        return this.server.io.sockets.connected[socket_id];
    };
    EchoServer.prototype.broadcast = function (channel, message) {
        if (message.socket && this.find(message.socket)) {
            return this.toOthers(this.find(message.socket), channel, message);
        }
        else {
            return this.toAll(channel, message);
        }
    };
    EchoServer.prototype.toOthers = function (socket, channel, message) {
        socket.broadcast.to(channel)
            .emit(message.event, channel, message.data);
        return true;
    };
    EchoServer.prototype.toAll = function (channel, message) {
        this.server.io.to(channel)
            .emit(message.event, channel, message.data);
        return true;
    };
    EchoServer.prototype.onConnect = function () {
        var _this = this;
        this.server.io.on('connection', function (socket) {
            _this.onSubscribe(socket);
            _this.onUnsubscribe(socket);
            _this.onDisconnecting(socket);
            _this.onClientEvent(socket);
        });
    };
    EchoServer.prototype.onSubscribe = function (socket) {
        var _this = this;
        socket.on('subscribe', function (data) {
            _this.channel.join(socket, data);
        });
    };
    EchoServer.prototype.onUnsubscribe = function (socket) {
        var _this = this;
        socket.on('unsubscribe', function (data) {
            _this.channel.leave(socket, data.channel, 'unsubscribed');
        });
    };
    EchoServer.prototype.onDisconnecting = function (socket) {
        var _this = this;
        socket.on('disconnecting', function (reason) {
            Object.keys(socket.rooms).forEach(function (room) {
                if (room !== socket.id) {
                    _this.channel.leave(socket, room, reason);
                }
            });
        });
    };
    EchoServer.prototype.onClientEvent = function (socket) {
        var _this = this;
        socket.on('client event', function (data) {
            _this.channel.clientEvent(socket, data);
        });
    };
    return EchoServer;
}());
exports.EchoServer = EchoServer;