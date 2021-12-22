import Widget from "./Widget";
import {vec3, mat4} from "gl-matrix";
import type {KeyAction} from "./input";
import type SpriteBatch from "./SpriteBatch";

export enum DescendantFocusability {
	FocusAfterDescendants = 0x40000,
	FocusBeforeDescendants = 0x20000,
	FocusBlockDescendants = 0x60000,
}

const maskFocusability = 0x60000;

enum Flag {
	// ClipChildren,
}

export default abstract class WidgetGroup extends Widget {
	private groupFlags: number = DescendantFocusability.FocusBeforeDescendants;
	protected children: Widget[] = [];
	private focused: Widget | null = null;
	private transform = mat4.create();

	addWidget(child: Widget) {
		if (child.parent) throw new Error("The specified child already has a parent.");
		this.children.push(child);
		this.invalidate();
		child.parent = this;
	}

	removeWidget(child: Widget) {
		let clearChildFocus = false;
		if (child === this.focused) {
			child.clearFocus();
			clearChildFocus = true;
		}
		child.parent = null;
		this.children.splice(this.children.indexOf(child), 1);
		this.invalidate();
		if (clearChildFocus) {
			this.clearChildFocus(child);
			this.getRootWidget().requestFocus();
		}
	}

	removeAllWidgets() {
		for (const child of this.children) {
			if (this.focused == child)
				child.clearFocus();
			child.parent = null;
		}
		this.children = [];
		this.invalidate();
		if (this.focused) {
			this.clearChildFocus(this.focused);
			this.getRootWidget().requestFocus();
		}
	}

	onKey(type: KeyAction, key: string) {
		this.focused?.onKey(type, key);
	}

	draw(batch: SpriteBatch, dt: number, time: number) {
		var setTransform = this.x !== 0 || this.y !== 0;
		let oldMatrix = batch.getTransformMatrix();
		if (setTransform) {
			let transform = this.transform;
			mat4.fromTranslation(transform, vec3.fromValues(this.x, this.y, 0));
			mat4.multiply(transform, oldMatrix, transform);
			batch.setTransformMatrix(transform);
		}

		for (let child of this.children)
			child.draw(batch, dt, time);

		if (setTransform)
			batch.setTransformMatrix(oldMatrix);
	}

	clearFocus() {
		super.clearFocus();
		if (this.focused) {
			this.focused.clearFocus();
			this.focused = null;
		}
	}

	clearChildFocus(child: Widget) {
		this.focused = null;
		this.parent?.clearChildFocus(this);
	}

	requestChildFocus(child: Widget) {
		if (this.getDescendantFocusability() === DescendantFocusability.FocusBlockDescendants)
			return;

		this.clearFocus();

		if (this.focused !== child) {
			this.focused?.clearFocus();
			this.focused = child;
		}

		this.parent?.requestChildFocus(this);
	}

	/**
	 * Returns the widget that currently has focus.
	 */
	getFocusedChild(): Widget | null {
		return this.focused;
	}

	hasFocus(): boolean {
		return !!this.getFocusedChild() || super.hasFocus();
	}

	protected hasSelfFocus(): boolean {
		return super.hasFocus();
	}

	// hasFocusable() {}

	requestFocus(): boolean {
		switch (this.getDescendantFocusability()) {
			case DescendantFocusability.FocusBlockDescendants:
				return super.requestFocus();
			case DescendantFocusability.FocusBeforeDescendants: {
				let took = super.requestFocus();
				return took || this.onRequestFocusInDescendants();
			}
			case DescendantFocusability.FocusAfterDescendants: {
				let took = this.onRequestFocusInDescendants();
				return took || super.requestFocus();
			}
		}
	}

	onRequestFocusInDescendants() {
		for (var i = 0, length = this.children.length; i < length; ++i) {
			var widget = this.children[i];
			if (widget.requestFocus()) return true;
		}
		return false;
	}

	// focusSearch(focused, direction) {}
	// focusableAvailable(widget) {}

	getDescendantFocusability(): DescendantFocusability {
		return this.groupFlags & maskFocusability;
	}

	setDescendantFocusability(focusability: DescendantFocusability) {
		this.groupFlags = this.groupFlags & ~maskFocusability | focusability;
	}
}
