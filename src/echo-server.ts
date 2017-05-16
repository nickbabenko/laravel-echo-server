import { Log } from './log';
import { Domain } from './domain';

const packageFile = require('../package.json');

/**
 * Echo server class.
 */
export class EchoServer {
    
    /**
     * Default server options.
     *
     * @type {object}
     */
    public defaultOptions: any = {
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

    /**
     * Configurable server options.
     *
     * @type {object}
     */
    public options: any;

    private domains: { [domain:string]: Domain } = {};

    /**
     * Create a new instance.
     */
    constructor() { }

    /**
     * Start the Echo Server.
     *
     * @param  {Object} config
     * @return {Promise}
     */
    run(options: any): Promise<any> {

        
        return new Promise((resolve, reject) => {
            this.options = Object.assign(this.defaultOptions, options);
            this.startup();
            let count = 0;
            this.options.domains.forEach((domain: any) => {
                let options = Object.create(this.options);

                if (typeof domain === 'object' &&
                    typeof domain.port === 'number' &&
                    typeof domain.domain === 'string') {
                    options.port = domain.port;
                    options.domain = domain.domain;
                } else if (typeof domain === 'string') {
                    options.domain = domain;
                } else {
                    throw 'Invalid domain configuration';
                }

                options.sslCertPath = this.options.sslCertPath + options.domain + '.crt';
                options.sslKeyPath = this.options.sslKeyPath + options.domain + '.key';

                this.domains[options.domain] = new Domain(options);
            });
        });
    }

    /**
     * Text shown at startup.
     *
     * @return {void}
     */
    startup(): void {
        Log.title(`\nL A R A V E L  E C H O  S E R V E R\n`);
        Log.info(`version ${packageFile.version}\n`);

        if (this.options.devMode) {
            Log.warning('Starting server in DEV mode...\n');
        } else {
            Log.info('Starting server...\n')
        }
    }
}
