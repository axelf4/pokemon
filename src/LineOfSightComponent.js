// Constants returned by triggerCheck
var LOS_NO_ACTION = 0;
var LOS_TRIGGER = 1;
var LOS_TRIGGER_AND_SNAP = 2;

/**
 * script & triggerCheck signature: function(game, em, caster, blocker)
 */

var LineOfSightComponent = function(script, length) {
	if (!script) throw new Error("script must not be null.");

	this.script = script;
	this.length = length || 16;
	this.currentBlocker = null; // The entity that is standing in our sights or null
};

LineOfSightComponent.LOS_NO_ACTION = LOS_NO_ACTION;
LineOfSightComponent.LOS_TRIGGER = LOS_TRIGGER;
LineOfSightComponent.LOS_TRIGGER_AND_SNAP = LOS_TRIGGER_AND_SNAP;

module.exports = LineOfSightComponent;
