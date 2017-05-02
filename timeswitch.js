module.exports = function(RED) {

    /**
     * the scheduler
     * @type {scheduler|exports|module.exports}
     */
    var scheduler = require('./lib/scheduler');

    RED.nodes.registerType("timeswitch", function(config) {
        RED.nodes.createNode(this,config);
        var node = this;

        /** maintain the output state so we dont send msgs if we dont have to */
        var outputState;

        /** initialise the scheduler */
        scheduler.create(config.schedules);

        /* register an alarm handler */
        scheduler.register(alarm);

        /* disable scheduler if configured as such */
        if (config.disabled) scheduler.disable();

        /** start up node listeners */
        // startListeners();

        /** start the scheduler */
        scheduler.start();

        setTimeout(function() {
            status();
            send();
        }, 1000);


        /* clean up after close */
        node.on('close', function() {
            scheduler.get().forEach(function(s) {
                if (s.events && s.events.start) clearTimeout(s.events.start);
                if (s.events && s.events.end) clearTimeout(s.events.end);
            });
        });

        /* handle incoming msgs */
        node.on('input', function(msg) {
            var command = msg.payload;

            if (command === 'on' || command === 1 || command === '1' || command === true ) {
                scheduler.manual('on');
            }

            if (command === 'off' || command === 0 || command === '0' || command === false ) {
                scheduler.manual('off');
            }

            if (command === 'pause') scheduler.pause();
            if (command === 'run') scheduler.run();

            status();
            send(msg);
        });

        /* done */


        /**
         * alarm handler function
         *
         * @param s
         */
        function alarm(s) {
            /** set new status */
            status();

            /** send new msg */
            send();
        }

        /**
         * print the current status
         */
        function status() {
            var state       = scheduler.state();
            var disabled    = scheduler.disabled();
            var paused      = scheduler.paused();
            var manual      = scheduler.manual();
            var count       = scheduler.count();
            var current     = count > 0 ? scheduler.current() : false;
            var next        = count > 0 ? scheduler.next() : false;
            var now         = new Date();

            var color = state === 'on' ? 'green' : (state === 'off' ? 'red' : 'grey');

            /* build the status text */
            var text = state ? state : '';

            if (manual) text += ' manual';

            if (disabled) {
                text += ' (disabled)';
            } else if (count < 1) {
                text += ' (empty)';
            } else if (paused) {
                text += ' (paused)'
            }

            if (!disabled && !paused && count > 0) {
                var untiltime;

                if (manual && state=='on'  && current.active)   untiltime = current.off;
                if (manual && state=='off' && current.active)   untiltime = next.on;
                if (manual && state=='on'  && !current.active)  untiltime = current.off;
                if (manual && state=='off' && !current.active)  untiltime = current.on;

                untiltime = manual ? untiltime : (current.active ? current.off : current.on);

                text += ' until ' + statusTime(untiltime);

                /** if it's tomorrow, add a visual cue */
                if (scheduler.earlier(untiltime, now)) text += '+1';
            }

            node.status({
                fill: color,
                shape: "dot",
                text: text
            });
        }


        /**
         * send a msg to the next node
         *
         * @param state
         */
        function send(msg) {
            if (typeof msg == 'undefined') msg = {topic: ''};

            var state = scheduler.state();

            /** if we dont know the state, dont send a msg */
            if (!state) return;

            /* if state hasnt changed, just return */
            if (state === outputState) return;

            /* set new output state */
            outputState = state;

            if (state == 'on') {
                msg.payload = config.onpayload ? config.onpayload : state;
                msg.topic   = config.ontopic ? config.ontopic : msg.topic;
            } else {
                msg.payload = config.offpayload ? config.offpayload : state;
                msg.topic   = config.offtopic ? config.offtopic : msg.topic;
            }
            node.send(msg);
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
