var $constants = (function(){

	/**
	* Hours
	*/
	var HOUR_DIGITS = new Array(8, 9, 10, 11, 12, 1, 2, 3, 4, 5);
	var HOUR_DISPS = _.map(HOUR_DIGITS, function(hourDigit){
		return _.str.sprintf("%s", hourDigit);
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
	var BEGIN_END = {begin: "begin", end: "end"};
	var DAYS = _.map(_.zip(DAY_NAMES, DAY_ABBRS), function(day){
		return {dayName: day[0], dayAbbr: day[1]};
	});

	return {
		HOURS: HOURS,
		MINS: MINS,
		DAYS: DAYS,
		DAY_ABBRS: DAY_ABBRS,
		BEGIN_END: BEGIN_END,
		HOURS_MINS: {hours: HOURS, minutes: MINS}
	};
})();

var $tc = (function() {

	/**
	* class Time
	**/
	function Time(hour, minute) {
		this.hour = hour;
		this.minute = minute;
	}

	Time.prototype.toDecimal = function() {
		var hr = this.hour;
		hr = hr < 8 ? hr+=12 : hr;
		hr += this.minute/60.0;
		return hr;
	};

	Time.prototype.toString = function() {
		var minPrefix = this.minute < 10 ? "0" : "";
		var ampm = this.hour >= 8 && this.hour < 12 ? "am" : "pm";
		return _.str.sprintf("%d:%s%d %s", this.hour, minPrefix, this.minute, ampm);
	};

	Time.prototype.diff = function(otherTime) {
		var diff = otherTime.toDecimal() - this.toDecimal();
		return Math.round(Math.abs(diff)*4)/4;
	};


	/**
	* class TimeInterval
	**/
	function TimeInterval(begin, end) {
		this.begin = begin;
		this.end = end;
	}

	TimeInterval.prototype.diff = function() {
		return this.end.diff(this.begin);
	};

	TimeInterval.prototype.toString = function() {
		return _.str.sprintf("%s to %s (%s hrs)", this.begin, this.end, this.diff());
	};


	/**
	* useful functions
	**/
	function interval(beginHr, beginMin, endHr, endMin) {
		return new TimeInterval(new Time(beginHr, beginMin), 
								new Time(endHr, endMin));
	}

	function total(intervals){
		return _.reduce(intervals, function(memo, interval){
			return memo + interval.diff();
		}, 0.0);
	}

	// var intv1 = interval(8,30,12,0);
	// var intv2 = interval(1,0,5,0);

	// alert(total([intv1, intv2]));

	return {
		Time: Time,
		TimeInterval: TimeInterval,
		interval: interval,
		total: total
	};

})();

var $disp = (function() {
	
	// aliases for frequently-used functions
	var _render = Mustache.render;
	var _sprintf = _.str.sprintf;

	// create a time from input
	function _time(abbr, beginEnd){
		var hrOptStr = _sprintf("#hour-select-%s-%s option:selected", abbr, beginEnd);
		var minOptStr = _sprintf("#minute-select-%s-%s option:selected", abbr, beginEnd);

		var hour = Number($(hrOptStr).val());
		var minute = Number($(minOptStr).val());

		return new $tc.Time(hour, minute);
	}

	// create a time interval from input
	function _interval(abbr) {
		var begin = _time(abbr, $constants.BEGIN_END.begin);
		var end = _time(abbr, $constants.BEGIN_END.end);
		return new $tc.TimeInterval(begin, end);
	}
	
	function createDayDivs() {

		// main content div
		var pageContent = $("#page-content");

		// grab templates
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
	}

	function addListeners() {

		// grab template
		var intervalTemplate = $("#interval-template").html();

		// attach listeners to "add" buttons
		_.each($constants.DAY_ABBRS, function(abbr){

			var intervalList = $(_sprintf("#interval-list-%s", abbr));
			$(_sprintf("#interval-submit-%s", abbr)).click(function(){

				var intvl = _interval(abbr);
				intervalList.append(_render(intervalTemplate, {interval: intvl}));

			});

		});
	}

	return {
		createDayDivs: createDayDivs,
		addListeners: addListeners
	};

})();

$($disp.createDayDivs);
$($disp.addListeners);