var Panel = require("Panel.js");
var Dialog = require("Dialog.js");
var align = require("align.js");
var loader = require("loader.js");
var texture = require("texture.js");
var Image = require("Image.js");
var Select = require("Select.js");

var BattleScene = function(nextScene, playerTrainer, enemyTrainer) {
	Panel.call(this);
	this.direction = Panel.DIRECTION_COLUMN;

	this.nextScene = nextScene;

	var view = this.view = new Panel();
	this.view.direction = Panel.DIRECTION_COLUMN;
	this.view.style.align = align.STRETCH;
	this.view.flex = 1;
	this.addWidget(this.view);

	// TODO add healthbars
	var dig = new Dialog("Hello");
	dig.flex = 1;
	dig.style.align = align.STRETCH;
	this.view.addWidget(dig);

	var slowpoke;
	loader.loadFile("assets/pokemon/Slowpoke.png", function(file) {
		slowpoke = new texture.Region();
		slowpoke.loadFromFile(file, function() {
			var image = new Image(slowpoke);
			image.style.align = align.CENTER;
			view.addWidget(image);
		});
	});

	this.info = new Panel();
	this.info.direction = Panel.DIRECTION_ROW;
	this.info.style.height = 100;
	this.info.style.align = align.STRETCH;
	this.addWidget(this.info);

	var self = this;
	var showDialog = function(text) {
		return new Promise(function(resolve, reject) {
			var dialog = new Dialog(text, function() { resolve(); });
			dialog.style.align = align.STRETCH;
			dialog.flex = 1;
			self.info.addWidget(dialog);
			dialog.requestFocus();
		});
	};

	showDialog("Slowpoke the almighty wants to kill your ugly ass. Hello my name is Axel and i live in Mölndal.")
		.then(function() {
			return showDialog("Hello there my lottle friend");
		}).then(function() {
		});

	var select = new Select(["FIGTH", "PKMN", "ITEMS", "RUN"], 2);
	select.style.align = align.STRETCH;
	this.info.addWidget(select);
};
BattleScene.prototype = Object.create(Panel.prototype);
BattleScene.prototype.constructor = BattleScene;

module.exports = BattleScene;
