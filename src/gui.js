var prepareNode = function(node) {
	node.width = 0;
	node.height = 0;
	node.top = 0;
	node.left = 0;
	if (!node.children) node.children = [];

	for (var i = 0, length = node.children.length; i < length; i++) prepareNode(node.children[i]);
};

var addWidgetToParent = function(parent, child) {
	parent.children.push(child);
	parent.dirty = true;
};

var removeWidgetFromParent = function(parent, child) {
	var i = parent.children.indexOf(child);
	parent.children.splice(i, 1);
	parent.dirty = true;
};

module.exports = {
	prepareNode: prepareNode,
	addWidgetToParent: addWidgetToParent,
	removeWidgetFromParent: removeWidgetFromParent,
};
