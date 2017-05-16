"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log_1 = require("./log");
var domain_1 = require("./domain");
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
        this.domains = {};
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
                options.sslCertPath = _this.options.sslCertPath + options.domain + '.crt';
                options.sslKeyPath = _this.options.sslKeyPath + options.domain + '.key';
                _this.domains[options.domain] = new domain_1.Domain(options);
            });
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
    return EchoServer;
}());
exports.EchoServer = EchoServer;
