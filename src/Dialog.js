var input = require("input.js");
var Container = require("Container.js");
var Label = require("Label.js");
var align = require("align.js");
var resources = require("resources.js");

// msgbox
var Dialog = function(text, listener) {
	Container.call(this);
	this.text = text;
	this.listener = listener;
	this.setFocusable(true);
	this.setBackground(resources.frame);

	var label = new Label(resources.font, text);
	label.justify = label.align = align.START;
	label.margin(8);
	this.addWidget(label);
};
Dialog.prototype = Object.create(Container.prototype);
Dialog.prototype.constructor = Dialog;

Dialog.prototype.onKey = function(type, key) {
	if (type === input.KEY_ACTION_DOWN && key === " ") {
		// TODO advance multipage text
		this.remove();
		if (this.listener) this.listener();
	}
};

Dialog.prototype.setOnClickListener = function(listener) {
	this.listener = listener;
};

module.exports = Dialog;
