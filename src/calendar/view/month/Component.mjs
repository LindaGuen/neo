import BaseComponent from '../../../component/Base.mjs';
import DateUtil      from '../../../util/Date.mjs';
import NeoArray      from '../../../util/Array.mjs';
import VDomUtil      from '../../../util/VDom.mjs';

const todayDate = new Date();

const today = {
    day  : todayDate.getDate(),
    month: todayDate.getMonth(),
    year : todayDate.getFullYear()
};

/**
 * @class Neo.calendar.view.month.Component
 * @extends Neo.component.Base
 */
class Component extends BaseComponent {
    static getConfig() {return {
        /**
         * @member {String} className='Neo.calendar.view.month.Component'
         * @protected
         */
        className: 'Neo.calendar.view.month.Component',
        /**
         * @member {String} ntype='calendar-view-monthcomponent'
         * @protected
         */
        ntype: 'calendar-view-monthcomponent',
        /**
         * @member {Object} bind
         */
        bind: {
            currentDate: data => data.currentDate
        },
        /**
         * @member {String[]} cls=['neo-calendar-monthcomponent']
         */
        cls: ['neo-calendar-monthcomponent'],
        /**
         * Will get passed from the MainContainer
         * @member {Date|null} currentDate_=null
         * @protected
         */
        currentDate_: null,
        /**
         * The format of the column headers.
         * Valid values are: narrow, short & long
         * @member {String} dayNameFormat_='short'
         */
        dayNameFormat_: 'short',
        /**
         * Internal flag to store the header height in px after getting mounted.
         * Needed for the infinite scrolling
         * @member {Number|null} headerHeight=null
         * @protected
         */
        headerHeight: null,
        /**
         * @member {Intl.DateTimeFormat|null} intlFormat_day=null
         * @protected
         */
        intlFormat_day: null,
        /**
         * @member {Intl.DateTimeFormat|null} intlFormat_month=null
         * @protected
         */
        intlFormat_month: null,
        /**
         * @member {Intl.DateTimeFormat|null} intlFormat_time=null
         * @protected
         */
        intlFormat_time: null,
        /**
         * @member {Boolean} isScrolling=false
         * @protected
         */
        isScrolling: false,
        /**
         * @member {String} locale_=Neo.config.locale
         */
        locale_: Neo.config.locale,
        /**
         * The format of the month header names.
         * Valid values are: narrow, short & long
         * @member {String} monthNameFormat_='long'
         */
        monthNameFormat_: 'short',
        /**
         * @member {Neo.calendar.view.MainContainer|null} owner=null
         * @protected
         */
        owner: null,
        /**
         * @member {String|null} scrollTask=null
         * @protected
         */
        scrollTaskId: null,
        /**
         * @member {Boolean} showWeekends_=true
         */
        showWeekends_: true,
        /**
         * @member {Object} timeFormat_={hour:'2-digit',minute:'2-digit'}
         */
        timeFormat_: {hour: '2-digit', minute: '2-digit'},
        /**
         * True to use box shadows for the months while scrolling
         * @member {Boolean} useScrollBoxShadows_=true
         */
        useScrollBoxShadows_: true,
        /**
         * @member {Object} vdom
         */
        vdom:
        {cn: [
            {cls: ['neo-days-header'], cn: [
                {cls: ['neo-static-header'], style: {}, cn: [
                    {tag: 'span', cls: ['neo-month-name'], flag: 'month-name'},
                    {vtype: 'text'}
                ]}
            ]},
            {cls: ['neo-c-m-scrollcontainer']}
        ]},
        /**
         * 0-6 => Sun-Sat
         * @member {Number} weekStartDay_=0
         */
        weekStartDay_: 0
    }}

    /**
     *
     * @param {Object} config
     */
    constructor(config) {
        super(config);

        let me           = this,
            domListeners = me.domListeners,
            model        = me.getModel();

        domListeners.push(
            {dblclick: me.onEventDoubleClick, delegate: 'neo-event', scope: me},
            {wheel   : me.onWheel, scope: me}
        );

        me.domListeners = domListeners;

        me.updateHeader(true);

        model.getStore('events').on('load', me.onEventsStoreLoad, me);
    }

    /**
     * Triggered after the currentDate config got changed
     * @param {Date} value
     * @param {Date} oldValue
     * @protected
     */
    afterSetCurrentDate(value, oldValue) {
        if (oldValue !== undefined) {
            let me = this;

            me.createContent(true);
            me.updateHeader();
            me.afterSetMounted(true, false); // todo: extract the logic into a new method
        }
    }

    /**
     * Triggered after the dayNameFormat config got changed
     * @param {String} value
     * @param {String} oldValue
     * @protected
     */
    afterSetDayNameFormat(value, oldValue) {
        let me = this;

        me.intlFormat_day = new Intl.DateTimeFormat(me.locale, {weekday: value});

        if (oldValue !== undefined) {
            me.updateHeader();
        }
    }

    /**
     * Triggered after the locale config got changed
     * @param {String} value
     * @param {String} oldValue
     * @protected
     */
    afterSetLocale(value, oldValue) {
        if (oldValue !== undefined) {
            let me = this;

            me.intlFormat_day   = new Intl.DateTimeFormat(value, {weekday: me.dayNameFormat});
            me.intlFormat_month = new Intl.DateTimeFormat(value, {month  : me.monthNameFormat});
            me.intlFormat_time  = new Intl.DateTimeFormat(value, me.timeFormat);

            me.updateMonthNames(true);
            me.updateHeader();
        }
    }

    /**
     * Triggered after the monthNameFormat config got changed
     * @param {String} value
     * @param {String} oldValue
     * @protected
     */
    afterSetMonthNameFormat(value, oldValue) {
        let me = this;

        me.intlFormat_month = new Intl.DateTimeFormat(me.locale, {month: value});

        if (oldValue !== undefined) {
            me.updateMonthNames();
        }
    }

    /**
     * Triggered after the mounted config got changed
     * @param {Boolean} value
     * @param {Boolean} oldValue
     * @protected
     */
    afterSetMounted(value, oldValue) {
        if (value) {
            setTimeout(() => {
                let me = this;

                Neo.main.DomAccess.getBoundingClientRect({
                    id: [me.vdom.cn[1].id, me.vdom.cn[0].id]
                }).then(data => {
                    me.headerHeight = data[1].height;

                    Neo.main.DomAccess.scrollTo({
                        direction: 'top',
                        id       : me.vdom.cn[1].id,
                        value    : data[0].height - data[1].height
                    });
                });
            }, 20);
        }
    }

    /**
     * Triggered after the showWeekends config got changed
     * @param {Boolean} value
     * @param {Boolean} oldValue
     * @protected
     */
    afterSetShowWeekends(value, oldValue) {
        if (oldValue !== undefined) {
            let me   = this,
                vdom = me.vdom,
                i, item;

            vdom.cn[1].cn.forEach(row => {
                if (row.flag) {
                    for (i=0; i < 7; i++) {
                        item = row.cn[i];

                        if (item.cls.includes('neo-weekend')) {
                            if (value) {
                                delete item.removeDom;
                            } else {
                                item.removeDom = true;
                            }
                        }
                    }
                }
            });

            // triggers the vdom update
            me.updateHeader();
        }
    }

    /**
     * Triggered after the timeFormat config got changed
     * @param {Object} value
     * @param {Object} oldValue
     * @protected
     */
    afterSetTimeFormat(value, oldValue) {
        this.intlFormat_time = new Intl.DateTimeFormat(this.locale, value);
    }

    /**
     * Triggered after the useScrollBoxShadows config got changed
     * @param {Boolean} value
     * @param {Boolean} oldValue
     * @protected
     */
    afterSetUseScrollBoxShadows(value, oldValue) {
        let me   = this,
            vdom = me.vdom;

        NeoArray[value ? 'add' : 'remove'](me.vdom.cn[1].cls, 'neo-scroll-shadows');
        me.vdom = vdom;
    }

    /**
     * Triggered after the weekStartDay config got changed
     * @param {Number} value
     * @param {Number} oldValue
     * @protected
     */
    afterSetWeekStartDay(value, oldValue) {
        if (oldValue !== undefined) {
            this.createContent(true);
            this.updateHeader();
        }
    }

    /**
     * Triggered before the dayNameFormat config gets changed
     * @param {String} value
     * @param {String} oldValue
     * @protected
     */
    beforeSetDayNameFormat(value, oldValue) {
        return this.beforeSetEnumValue(value, oldValue, 'dayNameFormat', DateUtil.prototype.dayNameFormats);
    }

    /**
     * Triggered before the monthNameFormat config gets changed
     * @param {String} value
     * @param {String} oldValue
     * @protected
     */
    beforeSetMonthNameFormat(value, oldValue) {
        return this.beforeSetEnumValue(value, oldValue, 'monthNameFormat', DateUtil.prototype.monthNameFormats);
    }

    /**
     *
     * @param {Boolean} [silent=false]
     */
    createContent(silent=false) {
        let me   = this,
            date = me.currentDate, // cloned
            vdom = me.vdom,
            i    = 0,
            firstDayOffset, row;

        vdom.cn[1].cn = [];

        firstDayOffset = DateUtil.getFirstDayOffset(date, me.weekStartDay);

        date.setDate(1 - firstDayOffset);

        date.setDate(date.getDate() - 6 * 7);

        for (; i < 18; i++) {
            row = me.createWeek(DateUtil.clone(date));

            if (row.header) {
                vdom.cn[1].cn.push(row.header);
            }

            vdom.cn[1].cn.push(row.row);

            date.setDate(date.getDate() + 7);
        }

        me[silent ? '_vdom' : 'vdom'] = vdom;
    }

    /**
     *
     * @param {Date} date
     * @returns {Object}
     */
    createWeek(date) {
        let me          = this,
            i           = 0,
            eventsStore = me.getModel().getStore('events'),
            header      = null,
            ymdDate     = DateUtil.convertToyyyymmdd(date),
            day, dayConfig, dayRecords, recordKey, row, weekDay;

        row = {
            flag: ymdDate,
            cls : ['neo-week'],
            cn  : [],
            id  : `${me.id}__week__${ymdDate}`
        };

        for (; i < 7; i++) {
            day     = date.getDate();
            ymdDate = DateUtil.convertToyyyymmdd(date);

            if (day === 1) {
                row.flag = ymdDate; // the first day of a month wins

                header = {
                    cls: ['neo-month-header'],
                    cn : [{
                        cls: ['neo-month-header-content'],
                        cn : [{
                            tag : 'span',
                            cls : ['neo-month-name'],
                            flag: 'month-name',
                            html: me.intlFormat_month.format(date)
                        }, {
                            vtype: 'text',
                            html : ` ${date.getFullYear()}`
                        }]
                    }]
                };
            }

            dayConfig = {
                cls: ['neo-day'],
                id : `${me.id}__day__${ymdDate}`,
                cn : [{
                    cls : ['neo-day-number'],
                    html: day,
                    id : `${me.id}__day_number__${ymdDate}`
                }]
            };

            weekDay = date.getDay();

            if (weekDay === 0 || weekDay === 6) {
                dayConfig.cls.push('neo-weekend');

                if (!me.showWeekends) {
                    dayConfig.removeDom = true;
                }
            }

            if (!dayConfig.removeDom) {
                dayRecords = eventsStore.getDayRecords(date);

                dayRecords.forEach(record => {
                    recordKey = record[eventsStore.keyProperty];

                    dayConfig.cn.push({
                        cls     : ['neo-event'],
                        flag    : recordKey,
                        id      : me.id + '__' + recordKey,
                        tabIndex: -1,

                        cn: [{
                            cls : ['neo-event-title'],
                            html: record.title,
                            id  : me.id + '__title__' + recordKey
                        }, {
                            cls : ['neo-event-time'],
                            html: me.intlFormat_time.format(record.startDate),
                            id  : me.id + '__time__' + recordKey
                        }]
                    });
                })
            }

            row.cn.push(dayConfig);

            date.setDate(date.getDate() + 1);
        }

        return {
            header: header,
            row   : row
        }
    }

    /**
     *
     * @param {Object} data
     */
    onEventDoubleClick(data) {
        if (this.data.allowEventEditing) {
            let me                  = this,
                editEventContainer  = me.owner.editEventContainer,
                eventNode           = data.path[0],
                weekNode            = data.path[2],
                scrollContainerNode = data.path[3],
                eventVdom           = VDomUtil.findVdomChild(me.vdom, eventNode.id).vdom,
                record              = me.getModel().getStore('events').get(eventVdom.flag),
                style               = editEventContainer.style;

            Object.assign(style, {
                left: `${eventNode.rect.right - weekNode.rect.left + 15}px`,
                top : `${eventNode.rect.top - scrollContainerNode.rect.top + scrollContainerNode.scrollTop - 12}px`,
            });

            editEventContainer.setSilent({
                currentView: me,
                parentId   : data.path[1].id,
                record     : record,
                style      : style
            });

            editEventContainer.render(true);
        }
    }

    /**
     *
     * @param {Object[]} data
     */
    onEventsStoreLoad(data) {
        this.createContent();
    }

    /**
     *
     * @param {Object} data
     * @param {Object[]} data.oldPath
     * @param {Object[]} data.path
     */
    onFocusChange(data) {
        let oldPath = data.oldPath,
            path    = data.path;

        if (oldPath) {
            if (oldPath[0].cls && oldPath[0].cls.includes('neo-event')) {
                Neo.applyDeltas(this.appName, {id: oldPath[0].id, cls: {remove: ['neo-focus']}});
            }
        }

        if (path) {
            if (path[0].cls && path[0].cls.includes('neo-event')) {
                Neo.applyDeltas(this.appName, {id: path[0].id, cls: {add: ['neo-focus']}});
            }
        }
    }

    /**
     *
     * @param {Object} data
     */
    onWheel(data) {
        if (Math.abs(data.deltaY) > Math.abs(data.deltaX)) {
            let me        = this,
                vdom      = me.vdom,
                container = vdom.cn[1],
                i         = 0,
                date, len, week;

            // console.log(data.scrollTop, Math.round(data.scrollTop / (data.clientHeight - me.headerHeight) * 6));

            if (data.deltaY > 0 && Math.round(data.scrollTop / (data.clientHeight - me.headerHeight) * 6) > 11) {
                date = new Date(container.cn[container.cn.length - 1].flag);

                date.setDate(date.getDate() - (date.getDay() - me.weekStartDay));

                for (; i < 6; i++) {
                    if (container.cn[1].cls.includes('neo-month-header')) {
                        container.cn.splice(1, 1);
                    }

                    container.cn.shift();

                    date.setDate(date.getDate() + 7);

                    week = me.createWeek(DateUtil.clone(date));

                    if (week.header) {
                        container.cn.push(week.header);
                    }

                    container.cn.push(week.row);
                }

                me.vdom = vdom;
            }

            else if (data.deltaY < 0 && Math.round(data.scrollTop / (data.clientHeight - me.headerHeight) * 6) < 1) {
                if (container.cn[0].flag) {
                    date = new Date(container.cn[0].flag);
                } else {
                    date = new Date(container.cn[1].flag);
                }

                date.setDate(date.getDate() - (date.getDay() - me.weekStartDay));

                for (; i < 6; i++) {
                    len = container.cn.length;

                    if (container.cn[len - 2].cls.includes('neo-month-header')) {
                        container.cn.splice(len - 2, 1);
                    }

                    container.cn.pop();

                    date.setDate(date.getDate() - 7);

                    week = me.createWeek(DateUtil.clone(date));

                    container.cn.unshift(week.row);

                    if (week.header) {
                        container.cn.unshift(week.header);
                    }
                }

                me.promiseVdomUpdate(me.vdom).then(() => {
                    Neo.main.DomAccess.scrollTo({
                        direction: 'top',
                        id       : me.vdom.cn[1].id,
                        value    : data.clientHeight - me.headerHeight
                    });
                });
            }

            if (!me.isScrolling) {
                me.isScrolling = true;
                NeoArray.add(me.vdom.cn[1].cls, 'neo-is-scrolling');
                me.vdom.cn[0].cn[0].style.opacity = 0;
                me.vdom = vdom;
            }

            if (me.scrollTaskId) {
                clearTimeout(me.scrollTaskId);
            }

            me.scrollTaskId = setTimeout(me.onWheelEnd.bind(me), 300);
        }
    }

    /**
     *
     */
    onWheelEnd() {
        let me     = this,
            vdom   = me.vdom,
            header = vdom.cn[0].cn[0],
            i      = 6,
            date, flag;

        me.isScrolling = false;

        for (; i < 12; i++) {
            flag = vdom.cn[1].cn[i].flag; // todo: #989 => get the date of the first fully visible row for the header

            if (flag) {
                date = new Date(flag);
                date.setMonth(date.getMonth() + 1);
                header.cn[0].html = me.intlFormat_month.format(date);
                header.cn[1].html = ` ${date.getFullYear()}`;
                break;
            }
        }

        NeoArray.remove(vdom.cn[1].cls, 'neo-is-scrolling');
        header.style.opacity = 1;

        me.vdom = vdom;

        // todo: #990 => scroll the view to the closest row
    }

    /**
     * Neo.calendar.view.EditEventContainer expects this method to exist
     */
    updateEvents() {
       this.createContent();
    }

    /**
     *
     * @param {Boolean} [create=false]
     */
    updateHeader(create=false) {
        let me     = this,
            date   = me.currentDate, // cloned
            vdom   = me.vdom,
            header = vdom.cn[0].cn[0],
            i      = 1,
            day, node;

        header.cn[0].html = me.intlFormat_month.format(date);
        header.cn[1].html = ` ${date.getFullYear()}`;

        date.setDate(me.currentDate.getDate() - me.currentDate.getDay() + me.weekStartDay);

        for (; i < 8; i++) {
            day = date.getDay();

            if (create) {
                node = {
                    cls : ['neo-day-name'],
                    html: me.intlFormat_day.format(date)
                };

                if (!me.showWeekends && (day === 0 || day === 6)) {
                    node.removeDom = true;
                }

                vdom.cn[0].cn.push(node);
            } else {
                node = vdom.cn[0].cn[i];

                node.html = me.intlFormat_day.format(date);

                if (!me.showWeekends && (day === 0 || day === 6)) {
                    node.removeDom = true;
                } else {
                    delete node.removeDom;
                }
            }

            date.setDate(date.getDate() + 1);
        }

        me.vdom = vdom;
    }

    /**
     *
     * @param {Boolean} [silent=false]
     */
    updateMonthNames(silent=false) {
        let me     = this,
            date   = me.currentDate, // cloned
            vdom   = me.vdom,
            months = VDomUtil.getFlags(vdom, 'month-name');

        months.forEach(month => {
            month.html = me.intlFormat_month.format(date);
            date.setMonth(date.getMonth() + 1);
        });

        me[silent ? '_vdom' : 'vdom'] = vdom;
    }
}

Neo.applyClassConfig(Component);

export {Component as default};