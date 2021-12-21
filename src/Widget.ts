import type WidgetGroup from "./WidgetGroup";
import type {KeyAction} from "./input";
import type SpriteBatch from "./SpriteBatch";

export enum Flag {
	LayoutRequired = 1,
	Focused = 2,
	Focusable = 4,
	MeasuredStateTooSmall = 0x01000000,
}

var FOCUS_AFTER_DESCENDANTS = 0x40000;
var FOCUS_BEFORE_DESCENDANTS = 0x20000;
var FOCUS_BLOCK_DESCENDANTS = 0x60000;

export default abstract class Widget {
	parent: WidgetGroup | null = null;
	private flags: number = Flag.LayoutRequired;
	x = 0; y = 0; width = 0; height = 0;
	marginTop = 0; marginRight = 0; marginBottom = 0; marginLeft = 0;
	style = {};

	/**
	 * Removes this widget from its parent.
	 */
	remove() {
		if (!this.parent)
			throw new Error("Cannot remove this widget since it does not have a parent");
		this.parent.removeWidget(this);
		this.invalidate();
	}

	setPosition(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	protected setDimension(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.flags &= ~Flag.LayoutRequired; // TODO maybe should not be here
	}

	abstract layout(): void;

	abstract onKey(type: KeyAction, key: string): void;
	abstract draw(batch: SpriteBatch, dt: number, time: number): void;

	isLayoutRequired(): boolean {
		return !!(this.flags & Flag.LayoutRequired);
	}

	// Invalidates this widget and upwards it's hierarchy.
	invalidate() {
		this.flags |= Flag.LayoutRequired;
		// this.measureCache = {}; // Flush the cache
		this.parent?.invalidate();
	}

	isFocusable(): boolean {
		return !!(this.flags & Flag.Focusable);
	}

	setFocusable(focusable: boolean) {
		if (focusable) this.flags |= Flag.Focusable;
		else this.flags &= ~Flag.Focusable;
	}

	hasFocus(): boolean {
		return !!(this.flags & Flag.Focused);
	}

	/**
	 * Clears the focus of this widget.
	 */
	clearFocus(propagate: boolean = false) {
		if (this.hasFocus()) {
			this.flags &= ~Flag.Focused;

			if (propagate) this.parent?.clearChildFocus(this);
		}
	}

	requestFocus(): boolean {
		if (!this.isFocusable()) return false;

		// Check if an ancestor is blocking focus
		let parent = this.parent;
		while (parent) {
			if (parent.getDescendantFocusability() === FOCUS_BLOCK_DESCENDANTS) return false;
			parent = parent.parent;
		}
		if (!this.hasFocus()) {
			this.flags |= Flag.Focused;
			this.parent?.requestChildFocus(this);
		}
		return true;
	}

	margin(value: number) {
		this.marginLeft = this.marginRight = this.marginTop = this.marginBottom = value;
	}

	getRootWidget(): Widget {
		let parent: Widget = this;
		while (parent.parent)
			parent = parent.parent;
		return parent;
	}
}
