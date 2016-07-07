var direction = require("direction");
var DirectionComponent = require("DirectionComponent");

// Constants returned by triggerCheck
var LOS_NO_ACTION = 0;
var LOS_TRIGGER = 1;
var LOS_TRIGGER_AND_SNAP = 2;

/**
 * triggerCheck signature: function(game, em, entity1, entity2, enterDirection)
 * where entity1 casts the line of sight
 * and entity2 stepped into it
 * @param enterDirection The direction from which the entity entered from
 */

/**
 * script signature: function(game, em, entity1, entity2, enterDirection)
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
	this.currentBlocker = null; // The entity that is standing in our sights or null
};

LineOfSightComponent.createSingleTriggerCheck = function(triggerCheck) {
	if (triggerCheck === undefined) throw new Error("triggerCheck cannot be undefined.");

	return function(game, em, entity1, entity2, enterDirection) {
		var dir = em.getComponent(entity1, DirectionComponent).value;

		if (enterDirection === direction.NO_DIRECTION
				|| enterDirection === dir || enterDirection === direction.getReverse(dir)) return LOS_NO_ACTION;
		else if (typeof triggerCheck === "function") return triggerCheck(game, em, entity1, entity2);
		else if (typeof triggerCheck === "number") return triggerCheck; // A default value was passed
		else throw new Error("Specified triggerCheck is invalid.");
	};
};

LineOfSightComponent.LOS_NO_ACTION = LOS_NO_ACTION;
LineOfSightComponent.LOS_TRIGGER = LOS_TRIGGER;
LineOfSightComponent.LOS_TRIGGER_AND_SNAP = LOS_TRIGGER_AND_SNAP;

module.exports = LineOfSightComponent;
