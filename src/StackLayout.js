/**
 * A simple layout that stacks the children.
 */
var StackLayout = function() {
};

StackLayout.prototype.layout = function(container) {
	var width = container.width, height = container.height;
	for (var i = 0, length = container.children.length; i < length; i++) {
		var item = container.children[i];
		item.left = 0;
		item.top = 0;
		item.width = width;
		item.height = height;
	}
};

module.exports = StackLayout;
