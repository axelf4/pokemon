'use strict';

/** @const */ var MODE_MASK = 0x3 << 30;

// The parent has not imposed any constraint on the child.
var UNSPECIFIED = exports.UNSPECIFIED = 0 << 30;
// The parent has determined an exact size for the child.
var EXACTLY = exports.EXACTLY = 1 << 30;
// The child can be as large as it wants up to the specified size.
var AT_MOST = exports.AT_MOST = 2 << 30;

// makeMeasureSpec
var make = exports.make = function(size, mode) {
	// return (size & ~MODE_MASK) | (mode & MODE_MASK);
	return size | mode;
};

var getMode = exports.getMode = function(measureSpec) {
	return measureSpec & MODE_MASK;
};

var getSize = exports.getSize = function(measureSpec) {
	return measureSpec & ~MODE_MASK;
};

exports.adjust = function(measureSpec, delta) {
	var mode = getMode(measureSpec);
	var size = getSize(measureSpec);
	if (mode == UNSPECIFIED) {
		return make(size, UNSPECIFIED); // No need to adjust size for UNSPECIFIED mode.
	}
	size += delta;
	if (size < 0) {
		// Log.e(VIEW_LOG_TAG, "MeasureSpec.adjust: new size would be negative! (" + size + ") spec: " + toString(measureSpec) + " delta: " + delta);
		size = 0;
	}
	return make(size, mode);
}
