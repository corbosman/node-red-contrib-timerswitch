module.exports = function() {

    'use strict';

    /* the scheduler object */
    var scheduler = {
        schedules: [],
        events: {},
        _state: false,
        _paused: false,
        _disabled: false,
        _override: false
    };

    var self;

    scheduler.create = function (config) {
        var active;
        self = this;

        /* clear the current schedules */
        self.clear();
        self._disabled = false;
        self._state = false;

        /* set initial state to off */
        scheduler.state('off');

        for (var i = 0; i < config.length; i++) {
            var c = config[i];

            /* skip invalid schedules */
            if (!c.valid) continue;

            /* build date objects */
            var on  = self.date(c.on_h, c.on_m, c.on_s);
            var off = self.date(c.off_h, c.off_m, c.off_s);

            var now = new Date();
            active = self.between(now, on, off);

            /* if currently active, but the on time is in the future (meaning it started yesterday), move on
               time to the past so our event handler starts immediately */
            if (active && on.getTime() > now.getTime()) {
                on.setHours(on.getHours() - 24);
            }

            /* if not currently active and on is below current time, then both are below current time so add 24 to both */
            if (!active && on.getTime() < now.getTime()) {
                on.setHours(on.getHours() + 24);
                off.setHours(off.getHours() + 24);
            }

            /* if off is still below current time, then move off up 24 hours */
            if (off.getTime() < now.getTime()) {
                off.setHours(off.getHours() + 24);
            }

            /* push the schedule to the scheduler */
            self.add({
                id: i,
                on: on,
                off: off,
                active: active,
                events: {}
            });
        }
    };

    /*
     * start up the scheduler
     */
    scheduler.start = function () {
        if (self.disabled()) return;
        if (self.count() < 1) return;

        /* foreach scheduler fire off events */
        self.get().forEach(function (s, i) {
            var start;

            /* if the schedule is currently active, set the scheduler to on */
            if (s.active) self.state('on');

            /* start event */
            self.registerEvent(i, 'start', setTimeout(self.turnon, self.until(s.on), s, i));
        });

        self.startMidnightEvent();
    };

    /**
     * fire off event that alters the status every night at 00:00:00 to get rid of the +1
     */
    scheduler.startMidnightEvent = function () {
        var midnight = new Date();
        midnight.setHours(24,0,1,0);
        self.events.midnight = setTimeout(self.midnight, self.until(midnight));
    };

    /**
     * at midnight ring the alarm so we update the status
     */
    scheduler.midnight = function() {
        self.alarm();
        self.startMidnightEvent();
    };

    /**
     * get one or all schedules
     *
     * @param i
     * @returns {*}
     */
    scheduler.get = function (i) {
        if (typeof i === 'undefined') return self.schedules;
        return self.schedules[i];
    };

    /* set or get the current state */
    scheduler.state = function (state) {
        if (typeof state === 'undefined') return self._state;
        self._state = state;
    };

    /**
     * add a schedule
     *
     * @param schedule
     */
    scheduler.add = function (schedule) {
        self.schedules.push(schedule);
    };

    /**
     * clear the scheduler
     */
    scheduler.clear = function () {
        self.schedules = [];
    };

    /**
     * disable the scheduler
     */
    scheduler.disable = function () {
        self._disabled = true;
    };

    /**
     * check if scheduler is disabled
     *
     * @returns {*}
     */
    scheduler.disabled = function () {
        return self._disabled;
    };
    /**
     * pause the scheduler
     */
    scheduler.pause = function () {
        self._paused = true;
    };

    /**
     * unpause the scheduler
     */
    scheduler.resume = function () {
        self._paused = false;
        self._override = false;

        var s = self.current();

        if (s.active) {
            self.state('on');
        } else {
            self.state('off');
        }
    };

    /**
     * check if the scheduler is paused
     *
     * @returns {boolean|scheduler.paused|*}
     */
    scheduler.paused = function () {
        return self._paused;
    };

    /**
     * set the state manually
     * @param state
     */
    scheduler.manual = function (state) {
        if (typeof state === 'undefined') return self._override;
        self._state = state;
        self._override = true;
    };

    /**
     * set an alarm handler function to tell the main app there is an on/off event
     *
     * @param alarm
     */
    scheduler.register = function (alarm) {
        self.alarm = alarm;
    };

    /**
     * register an event with a scheduler so we can clear them later
     */
    scheduler.registerEvent = function (i, type, event) {
        self.schedules[i]['events'][type] = event;
    };

    /* time support methods */

    /**
     * create a date objects
     * @param d_h
     * @param d_m
     * @param d_s
     */
    scheduler.date = function (d_h, d_m, d_s) {
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
    scheduler.until = function (d) {
        var now = new Date();
        return d.getTime() - now.getTime();
    };

    /**
     * how many milliseconds between 2 times
     * @returns {number}
     * @param d1
     * @param d2
     */
    scheduler.duration = function (d1, d2) {
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
    scheduler.between = function (time, start, end) {
        if (start.getTime() <= end.getTime()) {
            return time.getTime() >= start.getTime() && time.getTime() < end.getTime();
        } else {
            return !(time.getTime() >= end.getTime() && time.getTime() < start.getTime());
        }
    };

    /**
     * check if d1 is earlier than d2
     *
     * @param d1
     * @param d2
     * @returns {boolean}
     */
    scheduler.earlier = function (d1, d2) {
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
    scheduler.addDay = function (i) {
        var s = self.schedules[i];
        s.on.setHours(s.on.getHours() + 24);
        s.off.setHours(s.off.getHours() + 24);
    };

    /**
     * get the current schedule. Could be running or the next one.
     * @returns {*}
     */
    scheduler.current = function () {
        var schedule = false;
        for (var i = 0; i < self.schedules.length; i++) {
            var s = self.schedules[i];
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
    scheduler.next = function () {
        var next = false;

        self.schedules.forEach(function (s) {
            next = (!next || s.on.getTime() < next.on.getTime()) ? s : next;
        });

        return next;
    };

    /**
     * return the number of schedules
     *
     * @returns {Number}
     */
    scheduler.count = function () {
        return self.schedules.length;
    };

    scheduler.setActive = function (i) {
        for (var j = 0; j < self.schedules.length; j++) {
            var s = self.schedules[j];
            s.active = (i == j) ? true : false;
        }
    }

    /**
     *
     * @param s
     * @param i
     */
    scheduler.turnon = function (s, i) {
        if (!self.paused()) self.state('on');

        /* fire OFF event */
        self.registerEvent(i, 'end', setTimeout(self.turnoff, self.until(s.off), s, i));

        /* set the schedule to the next day  */
        self.addDay(i);

        /* get the new schedule date */
        s = self.get(i);

        /* fire ON event */
        self.registerEvent(i, 'start', setTimeout(self.turnon, self.until(s.on), s, i));

        /* set the active schedule */
        self.setActive(i);

        if (!self.paused()) {
            /* timer has taken over again */
            self._override = false;

            /* send an alarm */
            self.alarm();
        }

    };

    /**
     * this is called by the OFF setTimeout
     * @param s
     * @param i
     */
    scheduler.turnoff = function (s, i) {
        self.schedules[i].active = false;

        if (!self.paused()) {
            self.state('off');
            /* timer has taken over again */
            self._override = false;

            /* send an alarm */
            self.alarm();
        }
    };


    return scheduler;
};