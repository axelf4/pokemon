import Container from "Container";
import Panel from "Panel";
var Label = require("Label.js");
var align = require("align.js");
var resources = require("resources.js");
import * as input from "input";

// TODO Add arrow instead of border
class Option extends Container {
	constructor(content) {
		super();
		content.margin(8);
		this.addWidget(content);
	}
}

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

		let newCursorX = this.cursorX, newCursorY = this.cursorY;
		switch (key) {
			case " ": // If space was pressed
				resources.clickSfx.play();
				const selectedOption = this.cursorX + this.cursorY * this.columnCount;
				this.listener(selectedOption);
				return;
			case "Shift": // Shift was pressed; return no option
				this.listener(-1);
				return;
			case "a": --newCursorX; break;
			case "d": ++newCursorX; break;
			case "w": --newCursorY; break;
			case "s": ++newCursorY; break;
		}

		// Try to move the cursor
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
