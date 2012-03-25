$(function() {

	var Time = Backbone.Model.extend({

		defaults: {
			hr: 8,
			min: 30
		},

		toString: function() {
			var hr = this.get("hr");
			var ampm = hr >= 8 && hr < 12 ? "am" : "pm";
			var min = this.get("min");
			var minPrefix = min < 10 ? "0" : "";
			return _.str.sprintf("%d:%s%d %s", this.get("hr"), minPrefix, min, ampm);
		},

		toDecimal: function() {
			var hr = this.get("hr");
			hr = hr < 8 ? hr+=12 : hr;
			hr += this.get("min")/60.0;
			return hr;
		},

		diff: function(otherTime) {
			var diff = otherTime.toDecimal() - this.toDecimal();
			return Math.round(Math.abs(diff)*4)/4;
		}

	});

	var TimeInterval = Backbone.Model.extend({

		defaults: {
			begin: new Time({hr: 8, min: 30}),
			end: new Time({hr: 12, min: 0})
		},

		toString: function() {
			return _.str.sprintf("%s to %s (%s hrs)", this.get("begin"), this.get("end"), this.diff());
		},

		diff: function() {
			return this.get("end").diff(this.get("begin"));
		}

	});

	function interval(startHr, startMin, endHr, endMin){
		return new TimeInterval({
			begin: new Time({hr: startHr, min: startMin}), 
			end: new Time({hr: endHr, min: endMin}) 
		});
	}

	var IntervalGroup = Backbone.Collection.extend({

		model: TimeInterval,

		total: function() {
			return this.reduce(function(memo, interval) { 
				return memo + interval.diff(); 
			}, 0.0);
		}

	});

	var hrs = new Array(8, 9, 10, 11, 12, 1, 2, 3, 4, 5);

	var mins = new Array();
	var min = 0;
	while (min < 60) {
		mins.push(min);
		min+=5;
	}

	var days = new Array("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");

	var dayAbbrs = new Array("mon", "tue", "wed", "thu", "fri");

	var DayModel = Backbone.Model.extend({

		defaults: {
			dayName: "Monday",
			dayAbbr: "mon"
		},

		toString: function() {
			return _.str.sprintf("%s (%s)", this.get("dayName"), this.get("dayAbbr"));
		}

	});

	var Days = Backbone.Collection.extend({model: DayModel});

	var dayModels = new Days;
	_.each(_.zip(days, dayAbbrs), function(a){
		dayModels.add(new DayModel({dayName: a[0], dayAbbr: a[1]}));
	});

	var DayView = Backbone.View.extend({

		tagName: "div",

		className: "day",

		initialize: function(){
			this.el = _.str.sprintf("#day-%s", this.model.get("dayAbbr"));
		},

		template: _.template($("#day-template").html()),

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}

	});

	var dayViews = dayModels.map(function(dayModel) {
		return new DayView({model: dayModel});
	});

	var AppView = Backbone.View.extend({

		tagName: "div",

		el: "#main",

		initialize: function() {
			this.render();
		},

		render: function() {
			
		}

	});

	var appView = new AppView;

	appView.$el.show();

});