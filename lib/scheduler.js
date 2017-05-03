(function () {
    'use strict';

    /* the scheduler object */
    var scheduler = {
        schedules: [],
        _state: false,
        _paused: false,
        _disabled: false,
        _override: false
    };

    scheduler.create = function(config)
    {
        var active;

        /** clear the current schedules */
        scheduler.clear();
        scheduler._disabled = false;
        scheduler._state = false;

        /** set initial state to off */
        scheduler.state('off');

        for (var i=0; i< config.length; i++) {
            var c = config[i];

            /* skip invalid schedules */
            if (!c.valid) continue;

            /** build date objects */
            var on  = scheduler.date(c.on_h, c.on_m, c.on_s);
            var off = scheduler.date(c.off_h, c.off_m, c.off_s);

            var now = new Date();
            active = scheduler.between(now, on, off);

            /* if not currently active and on is below current time, then both are below current time so add 24 to both */
            if (!active && on.getTime() < now.getTime()) {
                on.setHours(on.getHours()+24);
                off.setHours(off.getHours()+24);
            }

            /* if off is still below current time, then move off up 24 hours */
            if (off.getTime() < now.getTime()) {
                off.setHours(off.getHours()+24);
            }

            /** push the schedule to the scheduler */
            scheduler.add({
                id: i,
                on: on,
                off: off,
                active: active,
                events: {}
            });
        }
    };

    /**
     * start up the scheduler
     */
    scheduler.start = function() {

        if (scheduler.disabled()) return;
        if (scheduler.count() < 1) return;

        /** foreach scheduler fire off events */
        this.get().forEach(function(s, i) {
            var start;

            /* if the schedule is currently active, set the scheduler to on */
            if (s.active) scheduler.state('on');

            /** start event */
            scheduler.registerEvent(i, 'start', setTimeout(scheduler.turnon, scheduler.until(s.on), s, i));
        });
    };

    /**
     * get one or all schedules
     *
     * @param i
     * @returns {*}
     */
    scheduler.get = function(i) {
        if (typeof i === 'undefined') return this.schedules;
        return this.schedules[i];
    };

    /** set or get the current state */
    scheduler.state = function(state) {
        if (typeof state === 'undefined') return this._state;
        this._state = state;
    };

    /**
     * add a schedule
     *
     * @param schedule
     */
    scheduler.add = function(schedule) {
        this.schedules.push(schedule);
    };

    /**
     * clear the scheduler
     */
    scheduler.clear = function() {
        this.schedules = [];
    };

    /**
     * disable the scheduler
     */
    scheduler.disable = function() {
        this._disabled = true;
    };

    /**
     * check if scheduler is disabled
     *
     * @returns {*}
     */
    scheduler.disabled = function() {
        return this._disabled;
    };
    /**
     * pause the scheduler
     */
    scheduler.pause = function() {
        this._paused = true;
    };

    /**
     * unpause the scheduler
     */
    scheduler.run = function() {
        this._paused = false;
        this._override = false;
    };

    /**
     * check if the scheduler is paused
     *
     * @returns {boolean|scheduler.paused|*}
     */
    scheduler.paused = function() {
        return this._paused;
    };

    /**
     * set the state manually
     * @param state
     */
    scheduler.manual = function(state) {
        if (typeof state === 'undefined') return scheduler._override;
        scheduler._state = state;
        scheduler._override = true;
    };

    /**
     * set an alarm handler function to tell the main app there is an on/off event
     *
     * @param alarm
     */
    scheduler.register = function(alarm) {
        this.alarm = alarm;
    };

    /**
     * register an event with a scheduler so we can clear them later
     */
    scheduler.registerEvent = function(i, type, event) {
        this.schedules[i]['events'][type] = event;
    };

    /* time support methods */

    /**
     * create a date objects
     * @param d_h
     * @param d_m
     * @param d_s
     */
    scheduler.date = function(d_h, d_m, d_s) {
        var d = new Date();
        d.setHours(d_h);
        d.setMinutes(d_m);
        d.setSeconds(d_s);
        return d;
    };

    /**
     * how many milliseconds until the specified time
     * @param d
     * @returns {number}
     */
    scheduler.until = function(d) {
        var now = new Date();
        return d.getTime() - now.getTime();
    };

    /**
     * how many milliseconds between 2 times
     * @returns {number}
     * @param d1
     * @param d2
     */
    scheduler.duration = function(d1,d2) {
        return d2.getTime() - d1.getTime();
    };

    /**
     * check if a time is between 2 times
     * if end is before start, swap the times and take the inverse
     *
     * @param time
     * @param start
     * @param end
     * @returns {boolean}
     */
    scheduler.between = function(time, start, end) {
        if (start.getTime() <= end.getTime()) {
            return time.getTime() >= start.getTime() && time.getTime() < end.getTime();
        } else {
            return ! (time.getTime() >= end.getTime() && time.getTime() < start.getTime());
        }
    };

    /**
     * check if d1 is earlier than d2
     *
     * @param d1
     * @param d2
     * @returns {boolean}
     */
    scheduler.earlier = function(d1, d2) {
        if (d1.getHours() < d2.getHours()) return true;
        if (d1.getHours() > d2.getHours()) return false;

        if (d1.getMinutes() < d2.getMinutes()) return true;
        if (d1.getMinutes() > d2.getMinutes()) return false;

        if (d1.getSeconds() < d2.getSeconds()) return true;

        return false;
    };

    /**
     * set the scheduler to the next day
     * @param i
     */
    scheduler.addDay = function(i) {
        var s = this.schedules[i];
        s.on.setHours(s.on.getHours()+24);
        s.off.setHours(s.off.getHours()+24);
    };

    /**
     * get the current schedule. Could be running or the next one.
     * @returns {*}
     */
    scheduler.current = function() {
        var schedule = false;
        for(var i=0; i < scheduler.schedules.length; i++) {
            var s = scheduler.schedules[i];
            if (s.active) return s;
            if (!schedule || s.on.getTime() < schedule.on.getTime()) schedule = s;
        }
        return schedule;
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
    };

    /**
     * return the number of schedules
     *
     * @returns {Number}
     */
    scheduler.count = function() {
        return this.schedules.length;
    };

    scheduler.setActive = function(i) {
        for (var j=0; j< scheduler.schedules.length; j++) {
            var s = scheduler.schedules[j];
            s.active = (i == j) ? true : false;
        }
    }

    /**
     *
     * @param s
     * @param i
     */
    scheduler.turnon = function(s , i) {
        if (!scheduler.paused()) scheduler.state('on');

        /** fire OFF event */
        scheduler.registerEvent(i, 'end', setTimeout(scheduler.turnoff, scheduler.until(s.off), s, i));

        /** set the scheduler to the next day  */
        scheduler.addDay(i);

        /** get the new schedule date */
        s = scheduler.get(i);

        /** fire ON event */
        scheduler.registerEvent(i, 'start', setTimeout(scheduler.turnoff, scheduler.until(s.on), s, i));

        /** set the active schedule */
        scheduler.setActive(i);

        if (!scheduler.paused()) {
            /** timer has taken over again */
            scheduler._override = false;

            /** send an alarm */
            scheduler.alarm({
                state: 'on',
                schedule: s
            });
        }

    };

    /**
     * this is called by the OFF setTimeout
     * @param s
     * @param i
     */
    scheduler.turnoff = function(s,i) {
        scheduler.schedules[i].active = false;

        if (!scheduler.paused()) {
            scheduler.state('off');
            /** timer has taken over again */
            scheduler._override = false;

            /** send an alarm */
            scheduler.alarm({
                state: 'off',
                schedule: s
            });
        }
    };


    module.exports = scheduler;
})();