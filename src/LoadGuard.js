import Container from "./Container";

/**
 * Prevents child widget from being used until all resources have been loaded.
 */
export default class LoadGuard extends Container {
	constructor(loader, child) {
		super();
		this.addWidget(child);
		this.loaded = false;
		loader.all().then(() => {
			this.invalidate();
			this.loaded = true;
		});
	}

	layout(widthMeasureSpec, heightMeasureSpec) {
		if (this.loaded) super.layout(widthMeasureSpec, heightMeasureSpec);
		else this.setDimension(0, 0);
	}

	draw(batch, dt, time) {
		if (this.loaded) super.draw(batch, dt, time);
	}
}
