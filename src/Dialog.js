var Container = require("Container.js");
var input = require("input.js");
var Label = require("Label.js");
var align = require("align.js");
var resources = require("resources.js");

// msgbox
var Dialog = function(text, callback) {
	Container.call(this);
	this.text = text;
	this.callback = callback;

	var label = new Label(resources.font, text);
	label.justify = label.align = align.START;
	label.margin(8);
	this.addWidget(label);
};
Dialog.prototype = Object.create(Container.prototype);
Dialog.prototype.constructor = Dialog;

Dialog.prototype.onKey = function(type, keyCode) {
	if (type === input.KEY_ACTION_DOWN && keyCode === 32) {
		// TODO advance multipage text
		this.remove();
		if (this.callback) this.callback();
	}
};

module.exports = Dialog;
