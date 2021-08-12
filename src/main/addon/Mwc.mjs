import Base      from '../../core/Base.mjs';
import DomAccess from '../DomAccess.mjs';

/**
 * Helper class to include Google's Material Web Components into your neo.mjs app
 * https://www.amcharts.com/docs/v4/
 * @class Neo.main.addon.Mwc
 * @extends Neo.core.Base
 * @singleton
 */
class Mwc extends Base {
    static getConfig() {return {
        /**
         * @member {String} className='Neo.main.addon.Mwc'
         * @protected
         */
        className: 'Neo.main.addon.Mwc',
        /**
         * @member {Boolean} scriptsLoaded_=true
         * @protected
         */
        scriptsLoaded_: false,
        /**
         * @member {Boolean} singleton=true
         * @protected
         */
        singleton: true,
        /**
         * Remote method access for other workers
         * @member {Object} remote
         * @protected
         */
        remote: {
            app: [

            ]
        }
    }}

    /**
     *
     * @param {Object} config
     */
    constructor(config) {
        super(config);

        console.log('')
    }
}

Neo.applyClassConfig(Mwc);

let instance = Neo.create(Mwc);

Neo.applyToGlobalNs(instance);

export default instance;