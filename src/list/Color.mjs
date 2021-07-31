import Base from './Base.mjs';

/**
 * @class Neo.list.Color
 * @extends Neo.list.Base
 */
class Color extends Base {
    /**
     * form.field.Color needs to trigger a silent vdom update
     * @member {Boolean} silentSelectUpdate=false
     * @protected
     */
    silentSelectUpdate = false

    static getConfig() {return {
        /**
         * @member {String} className='Neo.list.Color'
         * @protected
         */
        className: 'Neo.list.Color',
        /**
         * @member {String} ntype='colorlist'
         * @protected
         */
        ntype: 'colorlist',
        /**
         * @member {String[]} cls=['neo-color-list','neo-list']
         */
        cls: ['neo-color-list', 'neo-list']
    }}

    /**
     * Override this method for custom renderers
     * @param {Object} record
     * @param {Number} index
     * @returns {Object|Object[]|String} Either a config object to assign to the item, a vdom cn array or a html string
     */
    createItemContent(record, index) {
        let me         = this,
            id         = record[me.store.keyProperty],
            isSelected = me.selectionModel.isSelected(me.getItemId(id));

        return [{
            tag  : 'i',
            cls  : ['neo-icon', 'fas', `fa-${isSelected ? 'check-' : ''}square`],
            id   : me.getListItemIconId(id),
            style: {
                color: record[me.displayField]
            }
        }, {
            vtype: 'text',
            html : record[me.displayField],
            id   : me.getListItemVtextId(id)
        }];
    }

    /**
     *
     * @param {Number|String} recordId
     * @returns {String}
     */
    getListItemIconId(recordId) {
        return `${this.id}__icon__${recordId}`;
    }

    /**
     *
     * @param {Number|String} recordId
     * @returns {String}
     */
    getListItemVtextId(recordId) {
        return `${this.id}__vtext__${recordId}`;
    }

    /**
     *
     * @param {String[]} items
     */
    onSelect(items) {
        let me = this;

        me.createItems(me.silentSelectUpdate);

        !me.silentSelect && me.focus(items[0]);
    }
}

Neo.applyClassConfig(Color);

export {Color as default};