(function () {
    'use strict';

    var scheduler = {};


    scheduler.create = function(config)
    {
        this.schedules = [];

        for (var i=0; i< config.length; i++) {
            var now  = new Date();
            var c = config[i];
            var alreadyRunning;

            /* skip invalid schedules */
            if (!c.valid) continue;

            var on = new Date();
            on.setHours(c.on_h);
            on.setMinutes(c.on_m);
            on.setSeconds(c.on_s);

            var off = new Date();
            off.setHours(c.off_h);
            off.setMinutes(c.off_m);
            off.setSeconds(c.off_s);

            /* is this schedule currently running */
            alreadyRunning = on.getTime() < off.getTime() ? this.between(now, on, off) : !this.between(now, off, on);

            /* if not running and on is below current time, then both are below current time so add 24 to both */
            if (!alreadyRunning && on.getTime() < now.getTime()) {
                on.setHours(on.getHours()+24);
                off.setHours(off.getHours()+24);
            }

            /* if off is still below current time, then move off up 24 hours */
            if (off.getTime() < now.getTime()) {
                off.setHours(off.getHours()+24);
            }

            var s = {
                on: on,
                off: off,
                alreadyRunning: alreadyRunning,
                events: {}
            }
            this.add(s);
        }

        return this.schedules;
    }


    /**
     * add a schedule
     *
     * @param schedule
     */
    scheduler.add = function(schedule) {
        this.schedules.push(schedule);
    }

    scheduler.until = function(d) {
        var now = new Date();
        return d.getTime() - now.getTime();
    }

    /**
     * set the scheduler to the next day
     * @param i
     */
    scheduler.addDay = function(i) {
        var s = this.schedules[i];
        s.on.setHours(s.on.getHours()+24);
        s.off.setHours(s.off.getHours()+24);
        return this.until(s.on);
    }

    /**
     * find the next schedule to run
     *
     * @returns {boolean}
     */
    scheduler.next = function() {
        var next = false;

        this.schedules.forEach(function(s) {
            next = (!next || s.on.getTime() < next.on.getTime()) ? s : next;
        });

        return next;
    }

    /**
     * return the duration of a schedule in milliseconds
     * @param s
     * @returns {number}
     */
    scheduler.duration = function(d1,d2) {
        return d2.getTime() - d1.getTime();
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