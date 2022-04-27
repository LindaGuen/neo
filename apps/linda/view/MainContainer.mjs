import Component    from '../../../src/component/Base.mjs';
import TabContainer from '../../../src/tab/Container.mjs';
import Viewport     from '../../../src/container/Viewport.mjs';

/**
 * @class Linda.view.MainContainer
 * @extends Neo.container.Viewport
 */
class MainContainer extends Viewport {
    static getConfig() {return {
        className: 'Linda.view.MainContainer',
        autoMount: true,
        layout   : {ntype: 'vbox', align: 'stretch'},

        items: [{
            module: TabContainer,
            height: 300,
            width : 500,
            style : {flex: 'none', margin: '20px'},

            itemDefaults: {
                module: Component,
                cls   : ['neo-examples-tab-component'],
                style : {padding: '20px'},
            },

            items: [{
                tabButtonConfig: {
                    iconCls: 'fa fa-home',
                    text   : 'Tab 1'
                },
                vdom: {innerHTML: 'Welcome to your new Neo App.'}
            }, {
                tabButtonConfig: {
                    iconCls: 'fa fa-play-circle',
                    text   : 'Tab 2'
                },
                vdom: {innerHTML: 'Have fun creating something awesome!'}
            }]
        }, {
            ntype: 'toolbar',
            flex: 'none',
            items: [{
                text: 'Hello CTS'
            }]
        }]
    }}
}

Neo.applyClassConfig(MainContainer);

export default MainContainer;