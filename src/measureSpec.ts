export enum Mode {
	// The parent has not imposed any constraint on the child.
	Unspecified = 0 << 30,
	// The parent has determined an exact size for the child.
	Exactly = 1 << 30,
	// The child can be as large as it wants up to the specified size.
	AtMost = 2 << 30,
}

const modeMask = 0x3 << 30;

export type MeasureSpec = number & {readonly MeasureSpec: unique symbol};

export function make(size: number, mode: Mode): MeasureSpec {
	return (size & ~modeMask | mode) as MeasureSpec;
}

export function getSize(spec: MeasureSpec): number {
	return (spec & ~modeMask) as number;
}

export function getMode(spec: MeasureSpec): Mode {
	return (spec & modeMask) as Mode;
}

export function adjust(spec: MeasureSpec, delta: number): MeasureSpec {
	let mode = getMode(spec), size = getSize(spec);
	if (mode == Mode.Unspecified)
		return make(size, Mode.Unspecified); // No need to adjust size if unspecified.
	size += delta;
	if (size < 0) {
		// throw new Error("MeasureSpec.adjust: new size would be negative!");
		size = 0;
	}
	return make(size, mode);
}
