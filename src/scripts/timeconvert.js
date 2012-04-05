var $tc_util = (function(){

	function clockMod(hour) {
		var mod = hour%12;
		return mod == 0 ? 12 : mod;
	}

	return {
		clockMod: clockMod
	};
})();

var $constants = (function(){

	/**
	* Hours
	*/
	var HOUR_DIGITS = _.range(8, 18);
	var HOUR_DISPS = _.map(HOUR_DIGITS, function(hourDigit){
		return _.str.sprintf("%s", $tc_util.clockMod(hourDigit));
	});
	var HOURS = _.map(_.zip(HOUR_DIGITS, HOUR_DISPS), function(hr){
		return {hour: hr[0], hourDisp: hr[1]};
	});

	/**
	* Minutes
	*/
	var MIN_DIGITS = new Array();
	var min = 0;
	while (min < 60) {
		MIN_DIGITS.push(min);
		min+=5;
	}
	var MIN_DISPS = _.map(MIN_DIGITS, function(minDigit){
		var prefix = minDigit < 10 ? "0" : "";
		return _.str.sprintf("%s%d", prefix, minDigit);
	});
	var MINS = _.map(_.zip(MIN_DIGITS, MIN_DISPS), function(min){
		return {minute: min[0], minuteDisp: min[1]};
	});

	/**
	* Days
	*/
	var DAY_NAMES = new Array("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
	var DAY_ABBRS = new Array("mon", "tue", "wed", "thu", "fri");
	var BEGIN = "begin";
	var END = "end";
	var BEGIN_END = {begin: BEGIN, end: END};
	var DAYS = _.map(_.zip(DAY_NAMES, DAY_ABBRS), function(day){
		return {dayName: day[0], dayAbbr: day[1]};
	});

	return {
		HOURS: HOURS,
		MINS: MINS,
		DAYS: DAYS,
		DAY_ABBRS: DAY_ABBRS,
		BEGIN: BEGIN,
		END: END,
		BEGIN_END: BEGIN_END,
		HOURS_MINS: {hours: HOURS, minutes: MINS},
		MAX_HR: 17.917 // about 5:55 pm, the highest possible time that can be entered
	};
})();

var $tc = (function() {

	/**
	* class Time
	**/
	function Time(hour, minute) {
		this.hour = hour;
		this.minute = minute;
		this.uid = _.uniqueId("time_");
	}

	Time.prototype.toDecimal = function() {
		return this.hour + this.minute/60.0;
	};

	Time.prototype.toString = function() {
		var minPrefix = this.minute < 10 ? "0" : "";
		var ampm = this.hour < 12 ? "am" : "pm";
		return _.str.sprintf("%d:%s%d %s", $tc_util.clockMod(this.hour), minPrefix, this.minute, ampm);
	};

	Time.prototype.diff = function(otherTime) {
		var diff = this.toDecimal() - otherTime.toDecimal();
		return diff;
	};

	Time.prototype.lessThan = function(otherTime) {
		return this.diff(otherTime) < 0;
	};

	Time.prototype.greaterThan = function(otherTime) {
		return this.diff(otherTime) > 0;
	};

	Time.prototype.equals = function(otherTime) {
		return this.uid == otherTime.uid 
			|| (this.hour == otherTime.hour && this.minute == otherTime.minute);
	};


	/**
	* class TimeInterval
	**/
	function TimeInterval(begin, end) {
		this.begin = begin;
		this.end = end;
		this.uid = _.uniqueId("timeinterval_");
	}

	TimeInterval.prototype.diff = function() {
		return this.end.diff(this.begin);
	};

	TimeInterval.prototype.toString = function() {
		return _.str.sprintf("%s to %s (%s hrs)", this.begin, this.end, this.diff());
	};

	TimeInterval.prototype.equals = function(otherInterval) {
		return this.uid = otherInterval.uid 
			|| (this.begin.equals(otherInterval.begin) && this.end.equals(otherInterval.end));
	};

	TimeInterval.prototype.overlaps = function(otherInterval) {
		return !otherInterval.end.lessThan(this.begin) && !this.end.lessThan(otherInterval.begin);
	};


	/**
	* class IntervalGroup
	**/
	function IntervalGroup() {
		this.intervals = new Array();
	}

	IntervalGroup.prototype.add = function(interval) {
		var canAdd = _.isEmpty(_.filter(this.intervals, function(intvl){
			return intvl.overlaps(interval);
		}));

		if (canAdd){
			this.intervals.push(interval);
			return true;
		}

		return false;
	};

	IntervalGroup.prototype.has = function(interval) {
		return !_.isEmpty(_.filter(this.intervals, function(intvl){
			return intvl.equals(interval);
		}));
	};

	IntervalGroup.prototype.remove = function(interval) {
		if (this.has(interval)){
			this.intervals.pop(interval);
			return true;
		}

		return false;
	};

	IntervalGroup.prototype.min = function() {
		return _.min(this.intervals, function(interval){
			return interval.begin.toDecimal();
		});
	};

	IntervalGroup.prototype.max = function() {
		return _.max(this.intervals, function(interval){
			return interval.end.toDecimal();
		});
	};

	IntervalGroup.prototype.total = function() {
		var rawTotal = _.reduce(this.intervals, function(memo, interval){
			return memo + interval.diff();
		}, 0.0);

		return Math.floor(rawTotal*4)/4;
	};


	/**
	* useful functions
	**/
	function interval(beginHr, beginMin, endHr, endMin) {
		return new TimeInterval(new Time(beginHr, beginMin), 
								new Time(endHr, endMin));
	}


	// public functions
	return {
		Time: Time,
		TimeInterval: TimeInterval,
		IntervalGroup: IntervalGroup,
		interval: interval
	};

})();

var $disp = (function() {
	
	// aliases for frequently-used functions
	var _render = Mustache.render;
	var _sprintf = _.str.sprintf;

	var groups = {};
	_.each($constants.DAY_ABBRS, function(abbr){
		groups[abbr] = new $tc.IntervalGroup();
	});

	// create a time from input
	function _time(abbr, beginEnd){
		var hour = Number($(_sprintf("#hour-select-%s-%s", abbr, beginEnd)).val());
		var minute = Number($(_sprintf("#minute-select-%s-%s", abbr, beginEnd)).val());

		return new $tc.Time(hour, minute);
	}

	// create a time interval from input
	function _interval(abbr) {
		var begin = _time(abbr, $constants.BEGIN);
		var end = _time(abbr, $constants.END);
		return new $tc.TimeInterval(begin, end);
	}

	function _setSelect(abbr, beginEnd, hour, minute) {
		$(_sprintf("#hour-select-%s-%s", abbr, beginEnd)).val(hour);
		$(_sprintf("#minute-select-%s-%s", abbr, beginEnd)).val(minute);

		if (beginEnd == $constants.BEGIN) {
			_autoAdvanceEnd(abbr);
		}
	}

	function _autoAdvanceEnd(abbr) {
		var begin = _time(abbr, $constants.BEGIN);
		var end = _time(abbr, $constants.END);

		if (end.lessThan(begin)){
			_setSelect(abbr, $constants.END, begin.hour + 1, begin.minute);
		}
	}

	function _renderIntervals(abbr) {

		var intervalList = $(_sprintf("#interval-list-%s", abbr));
		intervalList.empty();

		// grab template
		var intervalTemplate = $("#interval-template").html();

		_.each(groups[abbr].intervals, function(interval){
			intervalList.append(_render(intervalTemplate, {interval: interval}));
		});
		
	}

	function _renderDayTotal(abbr) {

		var dayTotalSpan = $(_sprintf("#day-total-value-%s", abbr));
		dayTotalSpan.empty();
		dayTotalSpan.append(groups[abbr].total());

	}

	function _renderWeekTotal() {

		var grandTotal = _.reduce(_.map($constants.DAY_ABBRS, function(abbr){
			return groups[abbr].total();
		}), function(memo, total){
			return memo + total;
		}, 0.0);

		var weekTotalSpan = $("#week-total-value");
		weekTotalSpan.empty();
		weekTotalSpan.append(grandTotal);		

	}
	
	function initialPageRender() {

		// main content div
		var pageContent = $("#page-content");

		// grab templates
		var weekTemplate = $("#week-total-template").html();
		var dayTemplate = $("#day-template").html();
		var inputTemplate = $("#time-input-template").html();
		var submitTemplate = $("#interval-submit-template").html();

		_.each($constants.DAYS, function(day){

			// render day
			pageContent.append(_render(dayTemplate, day));

			// render day input
			var intervalInput = $(_sprintf("#interval-input-%s", day.dayAbbr));
			_.each(_.map(_.values($constants.BEGIN_END), function(beginEnd){

				var inputTemplateData = _.extend(_.clone(day), {beginEnd: beginEnd}, $constants.HOURS_MINS);
				return _render(inputTemplate, inputTemplateData);

			}), function(input){

				intervalInput.append(input);

			});
			intervalInput.append(_render(submitTemplate, day));

		});

		pageContent.append(_render(weekTemplate));

		_.each($constants.DAY_ABBRS, function(abbr){
			_setSelect(abbr, $constants.BEGIN, 8, 30);
			_setSelect(abbr, $constants.END, 12, 0);
		});

	}

	function addListeners() {

		// attach listeners to "add" buttons
		_.each($constants.DAY_ABBRS, function(abbr){

			var autoAdvance = function() {
				_autoAdvanceEnd(abbr);
			};
			$(_sprintf("#hour-select-%s-begin", abbr)).change(autoAdvance);
			$(_sprintf("#minute-select-%s-begin", abbr)).change(autoAdvance);

			$(_sprintf("#interval-submit-%s", abbr)).click(function(){

				var interval = _interval(abbr);
				if (!groups[abbr].add(interval)){
					alert("Time intervals cannot overlap!");
				}
				else {
					_renderIntervals(abbr);
					_renderDayTotal(abbr);
					_renderWeekTotal();

					var max = groups[abbr].max().end;
					_setSelect(abbr, $constants.BEGIN, max.hour + 1, max.minute);
				}
			});

		});
	}

	return {
		initialPageRender: initialPageRender,
		addListeners: addListeners
	};

})();

var $tc_test = (function(){
	var TEST = false;
	var ALERT_IF_PASSED = false;

	function assert(caseName, expected, expression) {
		var passed = expected == expression;
		if (!passed || ALERT_IF_PASSED){
			var passFail = passed ? "PASSED": "FAILED";
			alert(_.str.sprintf("%s %s, expected: %s, got: %s", caseName, passFail, expected, expression));
		}
		return passed;
	}

	function runTests() {

		var time1 = new $tc.Time(8, 30);
		var time2 = new $tc.Time(13, 45);

		assert("time1 - time2 == -5.25", -5.25, time1.diff(time2));
		assert("time2 - time1 == 5.25", 5.25, time2.diff(time1));
		assert("time1 == time1", true, time1.equals(time1));
		assert("time1 == time2", false, time1.equals(time2));
		assert("time1 > time2", false, time1.greaterThan(time2));
		assert("time1 < time2", true, time1.lessThan(time2));
		assert("time2 > time1", true, time2.greaterThan(time1));
		assert("time2 < time1", false, time2.lessThan(time1));

		var int1 = $tc.interval(8,30,9,0);
		var int2 = $tc.interval(8,45,9,15);
		var int3 = $tc.interval(8,35,8,40);
		assert("int1 == int1", true, int1.equals(int1));
		assert("int1 == int2", false, int1.equals(int2));
		assert("int1 overlaps int2", true, int1.overlaps(int2));
		assert("int2 overlaps int1", true, int2.overlaps(int1));
		assert("int1 overlaps int3", true, int1.overlaps(int3));
		assert("int3 overlaps int1", true, int3.overlaps(int1));
		assert("int2 overlaps int3", false, int2.overlaps(int3));
		assert("int3 overlaps int2", false, int3.overlaps(int2));

		return true;
	}

	return {
		TEST: TEST,
		runTests: runTests
	};

})();

if (!($tc_test.TEST && $tc_test.runTests())){
	$($disp.initialPageRender);
	$($disp.addListeners);
}
