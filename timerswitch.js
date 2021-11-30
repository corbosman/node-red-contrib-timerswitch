module.exports = function(RED) {

    RED.nodes.registerType("timerswitch", function(config) {
        RED.nodes.createNode(this,config);
        var node = this;

        /**
         * the scheduler
         * @type {scheduler|exports|module.exports}
         */
        node.scheduler = require('./lib/scheduler')();

        /* maintain the output state so we dont send msgs if we dont have to */
        var outputState;

        /* initialise the scheduler */
        node.scheduler.create(config.schedules);

        /* register an alarm handler */
        node.scheduler.register(alarm);

        /* disable scheduler if configured as such */
        if (config.disabled) node.scheduler.disable();

        setTimeout(function() {
            /* start the scheduler */
            node.scheduler.start();

            status();
            send();
        }, 1000);


        /* clean up after close */
        node.on('close', function() {
            node.scheduler.get().forEach(function(s) {
                if (s.events && s.events.start) clearTimeout(s.events.start);
                if (s.events && s.events.end) clearTimeout(s.events.end);
            });

            if (node.scheduler.events.midnight) clearTimeout(node.scheduler.events.midnight);
        });

        /* handle incoming msgs */
        node.on('input', function(msg) {
            var command = msg.payload;

            if (command === 'on' || command === 1 || command === '1' || command === true ) {
                node.scheduler.manual('on');
            } else if (command === 'off' || command === 0 || command === '0' || command === false ) {
                node.scheduler.manual('off');
            } else if (command === 'pause') {
                node.scheduler.pause();
            } else if (command === 'resume' || command === 'run') {
                node.scheduler.resume();
            } else if (command === 'restart') {
        		outputState = null;
	    }

            status();
            send(msg);
        });

        /* done */


        /**
         * alarm handler function
         *
         * @param s
         */
        function alarm() {

            /* set new status */
            status();

            /* send new msg */
            send();
        }

        /**
         * print the current status
         */
        function status() {
            var state       = node.scheduler.state();
            var disabled    = node.scheduler.disabled();
            var paused      = node.scheduler.paused();
            var manual      = node.scheduler.manual();
            var count       = node.scheduler.count();
            var current     = count > 0 ? node.scheduler.current() : false;
            var next        = count > 0 ? node.scheduler.next() : false;
            var now         = new Date();

            var color = state === 'on' ? 'green' : (state === 'off' ? 'red' : 'grey');

            /* build the status text */
            var text = state ? state : '';

            if (manual) text += ' manual';

            if (disabled) {
                text += ' (disabled)';
            }  else if (paused) {
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

                /* if it's tomorrow, add a visual cue */
                if (node.scheduler.earlier(untiltime, now)) text += '+1';
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

            var state = node.scheduler.state();

            /* if we dont know the state, dont send a msg */
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
