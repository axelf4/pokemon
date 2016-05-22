var StackLayout = require("StackLayout.js");
var Widget = require("Widget.js");

var container = new Widget();
container.manager = new StackLayout();
container.focused = true;

module.exports = container;
