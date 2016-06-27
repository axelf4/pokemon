var Container = require("Container.js");
var Panel = require("Panel.js");
var Label = require("Label.js");
var align = require("align.js");
var resources = require("resources.js");
var input = require("input.js");

// TODO add arrow instead of border
var Option = function(text) {
	Container.call(this);
	this.drawBackground = false;
	var label = new Label(resources.font, text);
	label.margin(8);
	this.addWidget(label);
};
Option.prototype = Object.create(Container.prototype);
Option.prototype.constructor = Option;

// multichoice
var Select = function(optionNames, optionsPerLine, callback) {
	Container.call(this);
	this.callback = callback;
	this.optionsPerLine = optionsPerLine;

	var mainPanel = new Panel();
	mainPanel.direction = Panel.DIRECTION_ROW;
	mainPanel.justify = Panel.ALIGN_SPACE_AROUND;
	mainPanel.margin(4);
	this.addWidget(mainPanel);

	var columnCount = optionsPerLine;
	var columns = new Array(columnCount);
	for (var i = 0; i < columnCount; ++i) {
		var column = new Panel();
		column.direction = Panel.DIRECTION_COLUMN;
		column.style.align = align.STRETCH;
		// column.marginRight = 10; // Pokemon Emerald-like
		mainPanel.addWidget(column);
		columns[i] = column;
	}

	var rectangleShape = optionNames.length % optionsPerLine === 0;
	var options = this.options = new Array(optionNames.length);

	for (var i = 0; i < optionNames.length; ++i) {
		var columnIndex = i % columnCount;
		var rowIndex = Math.floor(i / columnCount);

		var name = optionNames[i];
		var option = new Option(name);
		option.style.align = align.STRETCH;
		if (rectangleShape) option.flex = 1;
		columns[columnIndex].addWidget(option);

		// Store the option for future use
		if (!options[columnIndex]) options[columnIndex] = [];
		options[columnIndex][rowIndex] = option;
	}

	this.cursorY = this.cursorX = 0;
	options[this.cursorX][this.cursorY].drawBackground = true;
};
Select.prototype = Object.create(Container.prototype);
Select.prototype.constructor = Select;

Select.prototype.onKey = function(type, keyCode) {
	if (type !== input.KEY_ACTION_DOWN) return;

	// If enter was pressed
	if (keyCode === 32) {
		var selectedOption = this.cursorX + this.cursorY * this.optionsPerLine;
		this.callback(selectedOption);
		return;
	}

	var newCursorX = this.cursorX, newCursorY = this.cursorY;
	if (keyCode === 65) {
		--newCursorX;
	} else if (keyCode === 68) {
		++newCursorX;
	} else if (keyCode === 87) {
		--newCursorY;
	} else if (keyCode === 83) {
		++newCursorY;
	}

	if ((newCursorX !== this.cursorX || newCursorY !== this.cursorY)
			&& typeof this.options[newCursorX] !== 'undefined'
			&& typeof this.options[newCursorX][newCursorY] !== 'undefined') {
		this.options[this.cursorX][this.cursorY].drawBackground = false;
		this.options[newCursorX][newCursorY].drawBackground = true;
		this.cursorX = newCursorX;
		this.cursorY = newCursorY;
	}
};

module.exports = Select;
