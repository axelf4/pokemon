var prepareNode = function(node) {
	node.width = 0;
	node.height = 0;
	node.top = 0;
	node.left = 0;
	if (!node.children) node.children = [];
	if (!node.focused) node.focused = false; // If keyboard focused
	node.parent = null;

	for (var i = 0, length = node.children.length; i < length; i++) prepareNode(node.children[i]);
};

var addWidgetToParent = function(parent, child) {
	if (child.parent) throw new Error("Widget already had parrent.");
	parent.children.push(child);
	parent.dirty = true;
	child.parent = parent;
};

var removeWidgetFromParent = function(parent, child) {
	var i = parent.children.indexOf(child);
	parent.children.splice(i, 1);
	parent.dirty = true;
	child.parent = null;
};

var focusWidget = function(widget) {
	widget.focused = true; // Focus the widget
	// Make sure the parent is focused
	var parent;
	while (parent = widget.parent) {
		// Unfocus any siblings
		var siblings = parent.children;
		for (var i = 0, length = siblings.length; i < length; i++) {
			siblings[i].focused = false;
		}
		parent.focused = true;
	}
};

module.exports = {
	prepareNode: prepareNode,
	addWidgetToParent: addWidgetToParent,
	removeWidgetFromParent: removeWidgetFromParent,
	focusWidget: focusWidget,
};
