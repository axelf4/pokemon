var MovementComponent = function(controller) {
	this.timer = 0;
	this.delay = 200;
	this.controllerStack = new Array();
	if (controller) this.controllerStack.push(controller);
};

MovementComponent.prototype.getInterp = function() {
	return this.timer / this.delay;
};

MovementComponent.prototype.getController = function() {
	if (this.controllerStack.length < 1) throw new Error("The controller stack was unexpectedly empty.");
	return this.controllerStack[this.controllerStack.length - 1];
};

MovementComponent.prototype.pushController = function(controller) {
	this.controllerStack.push(controller);
};

MovementComponent.prototype.popController = function() {
	this.controllerStack.pop();
};

module.exports = MovementComponent;
