var Container = require("Container.js");
var Panel = require("Panel.js");
var Label = require("Label.js");
var align = require("align.js");
var resources = require("resources.js");
var input = require("input.js");

var Option = function(text) {
	Container.call(this);
	this.drawBackground = false;
	var label = new Label(resources.font, text);
	label.margin(8);
	this.addWidget(label);
};
Option.prototype = Object.create(Container.prototype);
Option.prototype.constructor = Option;

var Select = function(optionNames, optionsPerLine) {
	Container.call(this);

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
		mainPanel.addWidget(column);
		columns[i] = column;
	}

	var options = this.options = [];

	for (var i = 0; i < optionNames.length; ++i) {
		var columnIndex = i % columnCount;
		var rowIndex = Math.floor(i / columnCount);

		var name = optionNames[i];
		var option = new Option(name);
		option.style.align = align.CENTER;
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

Select.prototype.update = function(dt, time) {
	var oldCursorX = this.cursorX, oldCursorY = this.cursorY;

	var newCursorX = this.cursorX, newCursorY = this.cursorY;

	if (input.keyPressed(65)) {
		--newCursorX;
	} else if (input.keyPressed(68)) {
		++newCursorX;
	} else if (input.keyPressed(87)) {
		--newCursorY;
	} else if (input.keyPressed(83)) {
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
