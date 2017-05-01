module.exports = function(RED) {

    /**
     * the scheduler
     * @type {scheduler|exports|module.exports}
     */
    var scheduler = require('./lib/scheduler');

    RED.nodes.registerType("timeswitch", function(config) {
        console.log(config);

        RED.nodes.createNode(this,config);
        var node = this;
        var state = 'off';
        
        /**
         * create scheduler
         */
        var schedules = scheduler.create(config.schedules);

        /** start up node handlers */
        handleNodeEvents();

        /** we have paused the schedule, dont fire ON/OFF event handlers */
        if (config.paused) {
            node.status({fill: 'red', shape: "dot", text: 'Paused'});
            return;
        }

        if (scheduler.count() < 1) {
            node.status({fill: 'red', shape: "dot", text: 'No schedules to run'});
            return;
        }

        /* start all the scheduled events
         * if the initial state is on, we fire an event in the past which starts immediately
         */
        var state = 'off';
        var until = false;
        schedules.forEach(function(s, i) {
            if (s.alreadyRunning) {
                state = 'on';
                s.events.start = setTimeout(startOn, scheduler.until(s.on), s, i);
                until = (!until || s.off.getTime() < until.getTime() ? s.off : until);
            } else {
                s.events.start = setTimeout(turnOn, scheduler.until(s.on), s, i);
                until = (!until || s.on.getTime() < until.getTime() ? s.on : until);
            }
        });

        /* set the initial status msg */
        setStatus(state, until, false);

        /* send initial msg */
        send(state);

        /* done */


        /**
         * finish an already started ON, and fire a new event for the next ON
         *
         * @param s
         * @param i
         */
        function startOn(s,i) {
            setStatus('on', s.off, false);
            s.events.end   = setTimeout(turnOff, scheduler.until(s.off), s, i);
            s.events.start = setTimeout(turnOn, scheduler.addDay(i), s, i);
        }

        /**
         * turning ON, fire OFF event and new ON event, set status
         * @param s
         * @param i
         */
        function turnOn(s, i) {
            setStatus('on', s.off, false);
            send('on', 'on', '');
            s.events.end   = setTimeout(turnOff, scheduler.duration(s.on, s.off), s, i);
            s.events.start = setTimeout(turnOn, scheduler.addDay(i), s, i);
        }

        /**
         * turning device OFF, setting status
         * @param s
         * @param i
         */
        function turnOff(s, i) {
            send('off');
            setStatus('off', scheduler.next().on, false);
        }

        /**
         * set the node status
         *
         * @param state
         * @param color
         * @param d
         */
        function setStatus(state, until, manual) {
            var color = state == 'on' ? 'green' : 'red';
            var text = state + ' ' + (until ? ' until ' + statusTime(until) : (manual ? 'manual' : ''));

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
        function send(state, payload, topic) {
            var msg;

            payload = (typeof payload === 'undefined') ? state : payload;
            topic   = (typeof topic   === 'undefined') ? ''    : topic;

            if (state == 'on') {
                msg = {
                    payload: config.onpayload ? config.onpayload : state,
                    topic: config.ontopic ? config.ontopic : ''
                };
            } else {
                msg = {
                    payload: config.offpayload ? config.offpayload : state,
                    topic: config.offtopic ? config.offtopic : ''
                };
            }

            setTimeout(function(){
                node.send(msg);
            }, 100);
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

        /**
         * node events
         */
        function handleNodeEvents() {

            /* handle incoming msgs */
            node.on('input', function(msg) {
                var command = msg.payload;

                if (command === 'on' || command === 1 || command === '1' || command === true ) {
                    msg.payload = config.onpayload ? config.onpayload : msg.payload;
                    msg.topic   = config.ontopic ? config.ontopic : msg.topic;
                    setStatus('on', false, true);
                }

                if (command === 'off' || command === 0 || command === '0' || command === false ) {
                    msg.payload = config.offpayload ? config.offpayload : msg.payload;
                    msg.topic   = config.offtopic ? config.offtopic : msg.topic;
                    setStatus('off', false, true);
                }

                node.send(msg);


            });

            /* clean up after close */
            node.on('close', function() {
                schedules.forEach(function(s) {
                   if (s.events && s.events.start) clearTimeout(s.events.start);
                   if (s.events && s.events.end) clearTimeout(s.events.end);
               });
            });
        }
    });
}
