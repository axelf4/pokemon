import {KeyAction} from "input";
import Container from "Container";
import Label from "./Label";
var align = require("align.js");
var resources = require("resources.js");

const dialogSpeed = 1 / 50;

export default class Dialog extends Container {
	/**
	 * @param passive Whether user interaction is disabled or not.
	 */
	constructor(text, listener, passive) {
		super();
		this.text = text;
		this.listener = listener;
		this.setFocusable(true);
		this.setBackground(resources.frame);

		let label = this.label = new Label(resources.font, text);
		label.justify = label.align = align.START;
		label.margin(8);
		label.displayUpTo = 0;
		this.addWidget(label);

		this.passive = passive;
		if (this.passive) this.label.showAllText();
	}

	/**
	 * Advances the text, closing the dialog if there is no more text.
	 *
	 * @return True, if there is text left, otherwise false.
	 */
	advance() {
		if (!this.passive) resources.clickSfx.play();

		if (this.label.showAllText()) return true;
		// Advance multi-page text
		if (this.label.advance()) {
			this.label.displayUpTo = 0;
			if (this.passive) this.label.showAllText();
			return true;
		}
		this.close();
	}

	onKey(type, key) {
		if (this.passive) return;
		if (type === KeyAction.Down && key === " ")
			this.advance();
	}

	draw(batch, dt, time) {
		if (!this.label.isShowingWholePage()) this.label.displayUpTo += dialogSpeed * dt;

		Container.prototype.draw.call(this, batch, dt, time);
	}

	showAllText() { this.label.showAllText(); }

	setOnClickListener(listener) {
		this.listener = listener;
	}

	/** Closes this dialog box. */
	close() {
		this.remove();
		this.listener?.();
	}
}
