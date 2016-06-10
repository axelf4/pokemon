var MeasureSpec = function(mode, size) {
	this.mode = mode;
	this.size = size;
};

MeasureSpec.AT_MOST = MeasureSpec.atMost = 0;
MeasureSpec.EXACTLY = MeasureSpec.exactly = 1;
MeasureSpec.UNSPECIFIED = MeasureSpec.unspecified = 2;

MeasureSpec.prototype.getMode = function() {
	return this.mode;
};

MeasureSpec.prototype.getSize = function() {
	return this.size;
};

module.exports = MeasureSpec;
