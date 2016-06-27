var State = require("State.js");
var Panel = require("Panel.js");
var Dialog = require("Dialog.js");
var align = require("align.js");
var loader = require("loader.js");
var texture = require("texture.js");
var Image = require("Image.js");
var Select = require("Select.js");
var promiseWhile = require("promiseWhile.js");
var thread = require("thread.js");
var stateManager = require("stateManager.js");

var BattleState = function(nextState, playerTrainer, enemyTrainer) {
	State.call(this);

	this.nextState = nextState;

	var widget = new Panel();
	widget.direction = Panel.DIRECTION_COLUMN;
	this.widget = widget;

	var view = new Panel();
	view.direction = Panel.DIRECTION_COLUMN;
	view.style.align = align.STRETCH;
	view.flex = 1;
	widget.addWidget(view);

	// TODO add healthbars
	var dig = new Dialog("Hello");
	dig.flex = 1;
	dig.style.align = align.STRETCH;
	view.addWidget(dig);

	var slowpoke;
	loader.loadFile("assets/pokemon/Slowpoke.png", function(file) {
		slowpoke = new texture.Region();
		slowpoke.loadFromFile(file, function() {
			var image = new Image(slowpoke);
			image.style.align = align.CENTER;
			view.addWidget(image);
		});
	});

	info = new Panel();
	info.direction = Panel.DIRECTION_ROW;
	info.style.height = 100;
	info.style.align = align.STRETCH;
	widget.addWidget(info);

	var showDialog = function(text) {
		return new Promise(function(resolve, reject) {
			var dialog = new Dialog(text, function() { resolve(); });
			dialog.style.align = align.STRETCH;
			dialog.flex = 1;
			info.addWidget(dialog);
			dialog.requestFocus();
		});
	};

	thread(function*() {
		var battling = true;

		var selected = yield new Promise(function(resolve, reject) {
			var dialog = new Dialog("Slowpoke the almighty wants to kill your ugly ass. Hello my name is Axel and i live in Mölndal.");
			dialog.style.align = align.STRETCH;
			dialog.flex = 1;
			info.addWidget(dialog);
			var select = new Select(["FIGTH", "BAG", "POKéMON", "RUN"], 2, selected => resolve(selected));
			select.style.align = align.STRETCH;
			info.addWidget(select);
			select.requestFocus();
		});
		console.log(selected);

		switch (selected) {
		case 0: // Fight
			break;
		case 1: // Bag
			break;
		case 2: // Pokemon
			break;
		case 3: // Run
			info.removeAllWidgets();
			battling = false;
			yield showDialog("Got away safely!");
			break;
		default:
			throw new Error("Invalid selected value.");
		}

		stateManager.setState(nextState);
	});
};
BattleState.prototype = Object.create(State.prototype);
BattleState.prototype.constructor = BattleState;

module.exports = BattleState;
