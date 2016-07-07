// Constants returned by triggerCheck
var LOS_NO_ACTION = 0;
var LOS_TRIGGER = 1;
var LOS_TRIGGER_AND_SNAP = 2;

/**
 * triggerCheck signature: function(game, em, entity1, entity2)
 * where entity1 casts the line of sight
 * and entity2 stepped into it
 */

/**
 * script signature: function(game, em, entity1, entity2)
 */

/*
 * If length is -1 then it is infinite.
 */
var LineOfSightComponent = function(triggerCheck, script, length) {
	if (!triggerCheck) throw new Error("triggerCheck must not be null.");
	if (!script) throw new Error("script must not be null.");

	this.triggerCheck = triggerCheck;
	this.script = script;
	this.length = length || 16;
};

LineOfSightComponent.LOS_NO_ACTION = LOS_NO_ACTION;
LineOfSightComponent.LOS_TRIGGER = LOS_TRIGGER;
LineOfSightComponent.LOS_TRIGGER_AND_SNAP = LOS_TRIGGER_AND_SNAP;

module.exports = LineOfSightComponent;
