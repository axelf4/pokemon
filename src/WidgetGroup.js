var Widget = require("Widget.js");
import {vec3, mat4} from "gl-matrix";

// var FLAG_CLIP_CHILDREN;
const FLAG_MASK_FOCUSABILITY = 0x60000;
export const FOCUS_AFTER_DESCENDANTS = 0x40000,
	FOCUS_BEFORE_DESCENDANTS = 0x20000,
	FOCUS_BLOCK_DESCENDANTS = 0x60000;

export default class WidgetGroup extends Widget {
	constructor() {
		super();
		this.children = [];
		this.focused = null; // The currently focused child or null
		this.groupFlags = FOCUS_BEFORE_DESCENDANTS;

		this.transform = mat4.create();
	}

	addWidget(child) {
		if (child.parent !== null) throw new Error("The specified child already has a parent.");
		this.children.push(child);
		this.invalidate();
		child.parent = this;
	}

	removeWidget(child) {
		var clearChildFocus = false;
		if (child === this.focused) {
			child.blur();
			clearChildFocus = true;
		}
		child.parent = null;
		var i = this.children.indexOf(child);
		this.children.splice(i, 1);
		this.invalidate();
		if (clearChildFocus) {
			this.clearChildFocus(child);
			this.getRootWidget().requestFocus();
		}
	}

	removeAllWidgets() {
		for (const child of this.children) {
			if (this.focused == child)
				child.blur();
			child.parent = null;
		}
		this.children = [];
		this.invalidate();
		if (this.focused) {
			this.clearChildFocus(this.focused);
			this.getRootWidget().requestFocus();
		}
	}

	onKey(type, keyCode) {
		if (this.focused) {
			this.focused.onKey(type, keyCode);
		}
	}

	draw(batch, dt, time) {
		var setTransform = this.x !== 0 || this.y !== 0;
		var oldMatrix;
		if (setTransform) {
			var transform = this.transform;
			oldMatrix = batch.getTransformMatrix();
			mat4.fromTranslation(transform, vec3.fromValues(this.x, this.y, 0));
			mat4.multiply(transform, oldMatrix, transform);
			batch.setTransformMatrix(transform);
		}

		for (var i = 0, length = this.children.length; i < length; ++i) {
			var child = this.children[i];
			child.draw(batch, dt, time);
		}

		if (setTransform) {
			batch.setTransformMatrix(oldMatrix);
		}
	}

	clearFocus() {
		super.clearFocus();
		if (this.focused !== null) {
			this.focused.clearFocus();
			this.focused = null;
		}
	}

	clearChildFocus(child) {
		this.focused = null;
		if (this.parent !== null) {
			this.parent.clearChildFocus(this);
		}
	}

	requestChildFocus(child) {
		if (this.getDescendantFocusability() === FOCUS_BLOCK_DESCENDANTS) {
			return;
		}

		this.blur();

		if (this.focused !== child) {
			if (this.focused !== null) {
				this.focused.blur();
			}
			this.focused = child;
		}

		if (this.parent) {
			this.parent.requestChildFocus(this);
		}
	}

	/**
	 * Returns the widget that currently has focus.
	 */
	getFocusedChild() {
		return this.focused;
	}

	hasFocus() {
		if (this.focused !== null) return true;
		return super.hasFocus();
	}

	hasFocusable() {}

	requestFocus() {
		var focusability = this.getDescendantFocusability();
		switch (focusability) {
			case FOCUS_BLOCK_DESCENDANTS:
				return super.requestFocus();
			case FOCUS_BEFORE_DESCENDANTS:
				var took = super.requestFocus();
				return took || this.onRequestFocusInDescendants();
			case FOCUS_AFTER_DESCENDANTS:
				var took = this.onRequestFocusInDescendants();
				return took || super.requestFocus();
			default:
				throw new Error("Invalid focusability.");
		}
	}

	onRequestFocusInDescendants() {
		for (var i = 0, length = this.children.length; i < length; ++i) {
			var widget = this.children[i];
			if (widget.requestFocus()) return true;
		}
		return false;
	}

	focusSearch(focused, direction) {
	}

	focusableAvailable(widget) {
	}

	getDescendantFocusability() {
		return this.groupFlags & FLAG_MASK_FOCUSABILITY;
	}

	setDescendantFocusability(focusability) {
		switch (focusability) {
			case FOCUS_BEFORE_DESCENDANTS:
			case FOCUS_AFTER_DESCENDANTS:
			case FOCUS_BLOCK_DESCENDANTS:
				break;
			default:
				throw new Error("Invalid argument.");
		}
		this.groupFlags = this.groupFlags & ~FLAG_MASK_FOCUSABILITY | focusability;
	}
}

WidgetGroup.prototype.drawChildren = WidgetGroup.prototype.draw;
WidgetGroup.prototype.blur = WidgetGroup.prototype.clearFocus;
