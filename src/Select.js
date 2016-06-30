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
var Select = function(optionNames, columnCount, listener) {
	Container.call(this);
	this.setFocusable(true);
	this.columnCount = columnCount;
	this.listener = listener;

	var mainPanel = new Panel();
	mainPanel.direction = Panel.DIRECTION_ROW;
	mainPanel.justify = Panel.ALIGN_SPACE_AROUND;
	mainPanel.margin(4);
	this.addWidget(mainPanel);

	var rectangleShape = optionNames.length % columnCount === 0;
	var columns = new Array(columnCount);
	for (var i = 0; i < columnCount; ++i) {
		var column = new Panel();
		column.direction = Panel.DIRECTION_COLUMN;
		column.style.align = align.STRETCH;
		// column.marginRight = 10; // Pokemon Emerald-like
		if (rectangleShape) column.justify = Panel.ALIGN_SPACE_AROUND;
		mainPanel.addWidget(column);
		columns[i] = column;
	}

	var options = this.options = new Array(optionNames.length);

	for (var i = 0; i < optionNames.length; ++i) {
		var columnIndex = i % columnCount;
		var rowIndex = Math.floor(i / columnCount);

		var name = optionNames[i];
		var option = new Option(name);
		option.style.align = align.STRETCH;
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

Select.prototype.onKey = function(type, key) {
	if (type !== input.KEY_ACTION_DOWN) return;

	// If space was pressed
	if (key === " ") {
		var selectedOption = this.cursorX + this.cursorY * this.columnCount;
		this.listener(selectedOption);
		return;
	}

	// Shift was pressed; return no option
	if (key === "Shift") {
		this.listener(-1);
		return;
	}

	var newCursorX = this.cursorX, newCursorY = this.cursorY;
	if (key === "a") {
		--newCursorX;
	} else if (key === "d") {
		++newCursorX;
	} else if (key === "w") {
		--newCursorY;
	} else if (key === "s") {
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

Select.prototype.setOnSelectListener = function(listener) {
	this.listener = listener;
};

module.exports = Select;
