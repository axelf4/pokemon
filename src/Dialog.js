var input = require("input.js");
var Container = require("Container.js");
var Label = require("Label.js");
var align = require("align.js");
var resources = require("resources.js");

const dialogSpeed = 1 / 50;

// msgbox
var Dialog = function(text, listener) {
	Container.call(this);
	this.text = text;
	this.listener = listener;
	this.setFocusable(true);
	this.setBackground(resources.frame);

	var label = this.label = new Label(resources.font, text);
	label.justify = label.align = align.START;
	label.margin(8);
	label.displayUpTo = 0;
	this.addWidget(label);
};
Dialog.prototype = Object.create(Container.prototype);
Dialog.prototype.constructor = Dialog;

Dialog.prototype.onKey = function(type, key) {
	if (type === input.KEY_ACTION_DOWN && key === " ") {
		if (this.label.showAllText()) return;
		// Advance multi-page text
		if (this.label.advance()) {
			this.label.displayUpTo = 0;
			return;
		}
		this.remove();
		if (this.listener) this.listener();
	}
};

Dialog.prototype.draw = function(batch, dt, time) {
	if (!this.label.isShowingWholePage()) this.label.displayUpTo += dialogSpeed * dt;

	Container.prototype.draw.call(this, batch, dt, time);
};

Dialog.prototype.setOnClickListener = function(listener) {
	this.listener = listener;
};

module.exports = Dialog;
