var Container = require("Container.js");
var Panel = require("Panel.js");
var Label = require("Label.js");
var align = require("align.js");
var resources = require("resources.js");
var input = require("input.js");

// TODO add arrow instead of border
const Option = function(content) {
	Container.call(this);
	content.margin(8);
	this.addWidget(content);
};
Option.prototype = Object.create(Container.prototype);
Option.prototype.constructor = Option;

// multichoice
export default class Select extends Container {
	constructor(optionContents, columnCount, listener) {
		super();
		this.setFocusable(true);
		this.columnCount = columnCount;
		this.listener = listener;
		this.setBackground(resources.frame);

		const mainPanel = new Panel();
		mainPanel.direction = Panel.DIRECTION_ROW;
		mainPanel.justify = Panel.ALIGN_SPACE_AROUND;
		mainPanel.margin(4);
		this.addWidget(mainPanel);

		var rectangleShape = optionContents.length % columnCount === 0;
		var columns = new Array(columnCount);
		for (var i = 0; i < columnCount; ++i) {
			var column = new Panel();
			column.direction = Panel.DIRECTION_COLUMN;
			column.style.align = align.STRETCH;
			column.marginRight = 10; // Pokemon Emerald-like
			if (rectangleShape) column.justify = Panel.ALIGN_SPACE_AROUND;
			mainPanel.addWidget(column);
			columns[i] = column;
		}

		const options = this.options = new Array(optionContents.length);
		for (var i = 0; i < optionContents.length; ++i) {
			var columnIndex = i % columnCount;
			var rowIndex = Math.floor(i / columnCount);

			var content = typeof optionContents[i] === "string" ? new Label(resources.font, optionContents[i]) : optionContents[i];
			var option = new Option(content);
			option.style.align = align.STRETCH;
			columns[columnIndex].addWidget(option);

			// Store the option for future use
			if (!options[columnIndex]) options[columnIndex] = [];
			options[columnIndex][rowIndex] = option;
		}

		this.cursorY = this.cursorX = 0;
		options[this.cursorX][this.cursorY].setBackground(resources.frame);
	}

	onKey(type, key) {
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
			this.options[this.cursorX][this.cursorY].setBackground(null);
			this.options[newCursorX][newCursorY].setBackground(resources.frame);
			this.cursorX = newCursorX;
			this.cursorY = newCursorY;
		}
	}

	setOnSelectListener(listener) {
		this.listener = listener;
	}
}
