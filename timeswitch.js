module.exports = function(RED) {

    /**
     * the scheduler
     * @type {scheduler|exports|module.exports}
     */
    var scheduler = require('./lib/scheduler');

    RED.nodes.registerType("timeswitch", function(config) {

        RED.nodes.createNode(this,config);
        var node = this;

        /**
         * running events
         */
        var events = { start: false, end: false};
        var next = { on: false, off: false};

        /**
         * initialise scheduler, get current schedule if any
         */
        var init = scheduler.init(config.schedules);
        console.log('init');
        console.log(init);

        this.on('input', function(msg) {
            msg.payload = msg.payload.toLowerCase();
            node.send(msg);
        });


        /**
         * nothing to see here, move along
         */
        if (scheduler.count() < 1) return;

        /**
         * schedule the next ON event
         */
        scheduleOn();

        /**
         * send the current state
         */
        if (init !== false) {
            /** fire an off event for the currently running schedule */
            scheduleOff(init)
            sendOn();
        } else {
            sendOff();
        }

        /**
         * schedule the next event
         */
        function scheduleOn() {
            console.log('scheduling on');
            /**
             * get the next start time
             */
            var s = scheduler.next();

            /**
             * clear timeout
             */
            if (events.start) {
                clearTimeout(events.start);
            }

            /**
             * new start event
             */
            events.start =  setTimeout(function(s) {
                console.log('on timeout');
                /** schedule current off */
                scheduleOff(s);

                /* send on msg */
                sendOn();

                /** schedule next on */
                scheduleOn();

            }, scheduler.diff(s.on), s);
            console.log(events)
            next.on = s.on;

        }

        /**
         * schedule off event
         * @param s
         */
        function scheduleOff(s) {
            console.log('scheduling off');
            console.log(s);

            if (events.end) {
                clearTimeout(events.end);
            }

            /** get the current schedule's duration */
            var duration = scheduler.duration(s);

            events.end = setTimeout(function() {
                sendOff();
            }, duration);
            next.off = s.off;

        }

        /**
         * send a new on msg
         */
        function sendOn() {
            console.log('on');
            now();
            console.log(next);
            node.status({
                fill: "green",
                shape: "dot",
                text: "On until " + statusTime(next.off)
            });
        }

        /**
         * send a new off msg
         */
        function sendOff() {
            console.log('off');
            now();
            console.log(next);
            node.status({
                fill: "red",
                shape: "dot",
                text: "Off until " + statusTime(next.on)
            });
        }


        function now() {
            var now = new Date();
            console.log('now: '+now);
        }

        /**
         * helper function to print time for the status node
         *
         * @param d
         * @returns {string}
         */
        function statusTime(d) {
            return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }

        /**
         * helper function to pad the time with zeros
         *
         * @param s
         * @returns {string|*}
         */
        function pad(s) {
            s = s.toString();
            if (s.length < 2) {
                s = "0".concat(s);
            }
            return s;
        }

    });
}
