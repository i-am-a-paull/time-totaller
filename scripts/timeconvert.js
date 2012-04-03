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
		_.str.sprintf("%s to %s (%s hrs)", this.begin, this.end, this.diff());
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
	
	var HOUR_DIGITS = new Array(8, 9, 10, 11, 12, 1, 2, 3, 4, 5);
	var HOUR_DISPS = _.map(HOUR_DIGITS, function(hourDigit){
		return _.str.sprintf("%s", hourDigit);
	});
	var HOURS = _.map(_.zip(HOUR_DIGITS, HOUR_DISPS), function(hr){
		return {hour: hr[0], hourDisp: hr[1]};
	});

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

	var DAY_NAMES = new Array("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
	var DAY_ABBRS = new Array("mon", "tue", "wed", "thu", "fri");
	var DAY_NAMES_ABBRS = _.zip(DAY_NAMES, DAY_ABBRS);
	var BEGIN_END = new Array("begin", "end");
	var DAYS = _.map(DAY_NAMES_ABBRS, function(day){
		return Array(day[0], day[1], BEGIN_END);
	});
	

	function createDayDivs() {
		var pageContent = $("#page-content");
		var dayTemplate = $("#day-template").html();
		var inputTemplate = $("#time-input-template").html();
		_.each(DAYS, function(day){
			pageContent.append(Mustache.render(dayTemplate, {dayName: day[0], dayAbbr: day[1]}));
			var intervalInput = $(_.str.sprintf("#interval-input-%s", day[1]));
			_.each(_.map(day[2], function(beginEnd){
				return Mustache.render(inputTemplate, {dayName: day[0], dayAbbr: day[1], beginEnd: beginEnd, hours: HOURS, minutes: MINS});
			}).reverse(), function(input){
				intervalInput.prepend(input);
			});
		});
	}

	function addListeners() {
		_.each(DAY_ABBRS, function(abbr){
			$(_.str.sprintf("#interval-input-%s", abbr)).click(function(){
				alert(abbr);
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