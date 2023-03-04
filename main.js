'use strict';

/*
 * Created with @iobroker/create-adapter v1.34.1
 */

// The adapter-core module gives you access to the core ioBroker functions you need to create an adapter
const utils = require('@iobroker/adapter-core');
const axios = require('axios');

class RbeTest extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'rbe-test',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.runInterval = null;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Reset the connection indicator during startup
        this.setState('info.connection', false, true);

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info('config option1: ' + this.config.option1);
        this.log.info('config option2: ' + this.config.option2);

        await this.setObjectNotExistsAsync('dateTime', {
            type: 'state',
            common: {
                name: 'dateTime',
                type: 'string',
                role: 'indicator',
                read: true,
                write: true,
                def: '',
                defAck: true,
            },
            native: {},
        });

        await this.setStateAsync('testVariable', { val: true, ack: true });
        await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

        const timeAPI = 'https://www.timeapi.io/api/Time/current/zone?timeZone=Europe/Berlin';
        this.runInterval = setInterval(async () => {
            try {
                const response = await axios.get(timeAPI);
                await this.setStateAsync('dateTime', { val: response.data.dateTime, ack: true });
            } catch (error) {
                this.log.error(error);
            }
        }, 2000);

        this.setState('info.connection', true, true);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (this.runInterval) {
                clearInterval(this.runInterval);
                this.runInterval = null;
            }
            callback();
        } catch (e) {
            // @ts-ignore
            this.log.error(`OnUnload: ${ e.message }`);
            callback();
        }
    }

}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new RbeTest(options);
} else {
    // otherwise start the instance directly
    new RbeTest();
}