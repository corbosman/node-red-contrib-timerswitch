(function () {
    'use strict';

    var scheduler = {};

    /**
     * initialise the schedule based on the editor input data
     *
     * @param config
     */
    scheduler.init = function(config) {
        var now = new Date();
        var running = false;
        var current = false;
        scheduler.schedules = [];

        for (var i=0; i< config.length; i++) {
            if (!config[i].valid) continue;

            var on = new Date();
            on.setHours(config[i].on_h);
            on.setMinutes(config[i].on_m);
            on.setSeconds(config[i].on_s);

            var off = new Date();
            off.setHours(config[i].off_h);
            off.setMinutes(config[i].off_m);
            off.setSeconds(config[i].off_s);

            if (on.getTime() < off.getTime()) {
                running = this.between(now, on, off);
            } else {
                running = !this.between(now, off, on);
            }
            console.log('running='+running);

            var s = {
                on: on,
                off: off
            }

            this.add(s);

            if (running) {
                current = {
                    on: new Date(on.getTime()),
                    off: new Date(off.getTime())
                };
            }
        }

        return current;
    }

    /**
     * add a schedule
     *
     * @param schedule
     */
    scheduler.add = function(schedule) {
        this.schedules.push(schedule);
    }

    /**
     * return the number of schedules
     *
     * @returns {Number}
     */
    scheduler.count = function() {
        return this.schedules.length;
    }

    /**
     * return the next scheduled time
     *
     * @returns {Date}
     */
    scheduler.next = function() {
        var next = false;
        var now  = new Date();

        for (var i=0; i < this.count(); i++) {
            var s = this.schedules[i];

            /** if the date is in the past, add a day */
            if (s.on.getTime() < now.getTime()) {
                s.on.setHours(s.on.getHours() + 24);
                s.off.setHours(s.off.getHours() + 24);
            }

            if (!next || s.on.getTime() < next.on.getTime()) {
                next = s;
            }
        }
        return next;
    }

    /**
     * return number of milliseconds between now and time
     *
     * @param time
     * @returns {number}
     */
    scheduler.diff = function(time) {
        var now = new Date();
        return time.getTime() - now.getTime();
    }

    /**
     * return the duration of a schedule in milliseconds
     * @param s
     * @returns {number}
     */
    scheduler.duration = function(s) {
        return s.off.getTime() - s.on.getTime();
    }

    scheduler.on = function() {
        var now = new Date();
    }

    /**
     * check if a time is between 2 times
     *
     * @param time
     * @param start
     * @param end
     * @returns {boolean}
     */
    scheduler.between = function(time, start, end) {
        return time.getTime() >= start.getTime() && time.getTime() < end.getTime();
    }

    module.exports = scheduler;
})();