var echo = require('../dist/index.js');

var options = {
	"appKey": "f2u141764bhtbhlsbd01b0gi7o23kd1fquitqphu9iebh8e8k4e49p0lu5d1",
	"authEndpoint": "/broadcasting/auth",
	"authHost": "http://backend",
	"database": "redis",
	"databaseConfig": {
		"redis": {
			"host": "redis",
			"port": 6379
		},
		"sqlite": {
			"databasePath": "/database/laravel-echo-server.sqlite"
		}
	},
	"devMode": false,
	"protocol": "https",
	"domains": [
		{
			"domain": "persona.dev",
			"port": 6001
		}
	],
	"sslCertPath": "/etc/certs/",
	"sslKeyPath": "/etc/certs/",
	"verifyAuthPath": true,
	"verifyAuthServer": true
};

echo.run(options);
