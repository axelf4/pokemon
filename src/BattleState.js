import State from "State";
var Panel = require("Panel.js");
var Container = require("Container.js");
var Dialog = require("Dialog.js");
var align = require("align.js");
var texture = require("texture.js");
var Image = require("Image.js");
var Select = require("Select.js");
import promiseWhile from "promiseWhile";
import thread from "thread";
import * as stateManager from "stateManager";
var pokemon = require("pokemon.js");
var Label = require("Label.js");
var Widget = require("Widget");
var measureSpec = require("measureSpec");
const Healthbar = require("Healthbar.js");
var resources = require("resources.js");
import battle, { battleEventText, battleEventQueryAction,
	battleEventDeployPokemon, battleEventUseMove,
	battleEventSetHealth,
	actionAttack, actionRun } from "battle";
var glMatrix = require("gl-matrix");
const renderer = require("renderer");
const TWEEN = require("@tweenjs/tween.js");

var vec3 = glMatrix.vec3;
var mat4 = glMatrix.mat4;

const BattleState = function(loader, nextState, player, enemy) {
	State.call(this);
	this.nextState = nextState;

	this.groundTex = null;
	loader.loadTexture("assets/battleground.png").then(texRegion => {
		this.groundTex = texRegion;
	});
	this.pokemon0Tex = null;
	loader.loadTexture("assets/pokemon/Slowpoke.png").then(region => {
		this.pokemon0Tex = region;
	});

	var widget = this.widget = new Panel();
	widget.direction = Panel.DIRECTION_COLUMN;

	var viewContainer = new Container();
	viewContainer.style.align = align.STRETCH;
	viewContainer.flex = 1;
	loader.loadTexture("assets/battlebg.png").then(texRegion => {
		viewContainer.background = texRegion;
	});
	widget.addWidget(viewContainer);

	var view = new Panel();
	view.direction = Panel.DIRECTION_ROW;
	view.justify = align.SPACE_AROUND;
	viewContainer.addWidget(view);

	const createInfoBox = function() {
		const container = new Container();
		container.background = resources.battleInfo;
		container.marginTop = 20;
		view.addWidget(container);

		const vPanel = new Panel();
		vPanel.direction = Panel.DIRECTION_COLUMN;
		vPanel.marginTop = 4;
		vPanel.marginRight = 12;
		vPanel.marginBottom = 7;
		vPanel.marginLeft = 4;
		container.addWidget(vPanel);

		const label = new Label(resources.font, "Snoop Dogg  Lv.4");
		label.style.align = align.STRETCH;
		vPanel.addWidget(label);

		const hpBar = new Healthbar(loader);
		hpBar.style.align = align.STRETCH;
		vPanel.addWidget(hpBar);

		return { hpBar };
	};

	const { hpBar: enemyHpBar } = createInfoBox();
	const { hpBar: playerHpBar } = createInfoBox();

	var info = new Panel();
	info.direction = Panel.DIRECTION_ROW;
	info.style.height = 100;
	widget.addWidget(info);

	const showDialog = function(text) {
		return new Promise(function(resolve, reject) {
			var dialog = new Dialog(text, resolve);
			dialog.style.align = align.STRETCH;
			dialog.flex = 1;
			info.addWidget(dialog);
			dialog.requestFocus();
		});
	};

	this.playerOffset = { x: 0, y: 0 };
	this.enemyOffset = { x: 0, y: 0 };

	const battleGen = battle(player, enemy);

	thread(function*() {
		let nextArg;
		for (;;) {
			let battleEvent = battleGen.next(nextArg);
			console.log("Battle event:", battleEvent);
			if (battleEvent.done) break;

			let eventVal = battleEvent.value;
			switch (eventVal.type) {
				case battleEventText:
					yield showDialog(eventVal.text);
					break;
				case battleEventQueryAction:
					let pokemon = eventVal.pokemon;
					let playerAction = null;
					while (!playerAction) {
						var selected = yield new Promise(function(resolve, reject) {
							var dialog = new Dialog(`What will ${pokemon.name} do?`);
							dialog.style.align = align.STRETCH;
							dialog.flex = 1;
							info.addWidget(dialog);
							var select = new Select(["FIGTH", "BAG", "POKEMON", "RUN"], 2, resolve);
							select.style.align = align.STRETCH;
							info.addWidget(select);
							select.requestFocus();
						});
						info.removeAllWidgets();
						switch (selected) {
							case -1:
								break; // Shift was pressed
							case 0: // Fight
								const moveId = yield new Promise(function(resolve, reject) {
									const moveNames = pokemon.moves.map(move => move.name);
									const select = new Select(moveNames, 2, resolve);
									select.style.align = align.STRETCH;
									select.flex = 1;
									info.addWidget(select);
									select.requestFocus();
								});
								info.removeAllWidgets();
								if (moveId !== -1) {
									const move = pokemon.moves[moveId];
									playerAction = { type: actionAttack, isPlayer: true, move };
								}
								break;
							case 1: // Bag
								yield showDialog("There's a time and place for everything, but not now...");
								break;
							case 2: // Pokemon
								yield showDialog("Cannot switch pokemons yet.");
								break;
							case 3: // Run
								// TODO can't escape against trainers
								playerAction = { type: actionRun, isPlayer: true };
								break;
							default:
								throw new Error("Invalid selected value.");
						}
					}
					nextArg = playerAction;
					break;
				case battleEventDeployPokemon:
					break;
				case battleEventUseMove:
					break;
				case battleEventSetHealth:
					let hpBar = eventVal.isPlayer ? playerHpBar : enemyHpBar;
					yield hpBar.setPercentage(eventVal.percentage);
					break;
			}
		}

		stateManager.setState(nextState);
		console.log("Switching to next state.");
	});
};
BattleState.prototype = Object.create(State.prototype);
BattleState.prototype.constructor = BattleState;


BattleState.prototype.draw = function(batch, dt, time) {
	const gl = renderer.gl;

	if (this.widget && this.widget.flags & Widget.FLAG_LAYOUT_REQUIRED) {
		var widthMeasureSpec = measureSpec.make(this.width, measureSpec.EXACTLY);
		var heightMeasureSpec = measureSpec.make(this.height, measureSpec.EXACTLY);

		this.widget.layout(widthMeasureSpec, heightMeasureSpec);
	}

	gl.disable(gl.CULL_FACE);
	batch.begin();
	this.widget.draw(batch, dt, time);
	const oldMatrix = batch.getTransformMatrix();

	const drawPokemon = (flipped, offset) => {
		const transform = mat4.create();
		mat4.fromScaling(transform, [this.width / 2, this.width / 2, 0]);
		const translation = vec3.create();
		vec3.set(translation, 1, this.height / 2 / this.width * 2, 0);

		mat4.multiply(transform, oldMatrix, transform);
		mat4.translate(transform, transform, translation);

		mat4.scale(transform, transform, [flipped ? -1 : 1, 1, 1]);

		batch.setTransformMatrix(transform);

		const bottomCenter = (width, height) => [-width / 2, -height],
		almostBottomCenter = (width, height) => [-width / 2, -0.9 * height],
		middleCenter = (width, height) => [-width / 2, -height / 2];

		const draw = (tex, x, y, width, align) => {
			const height = width * (tex.y1 - tex.y0) / (tex.x1 - tex.x0);
			const [ox, oy] = align(width, height);
			tex.draw(batch, x + ox, y + oy, width, height);
		};

		draw(this.groundTex, 0.5, 0.0, 0.7, middleCenter);
		draw(this.pokemon0Tex, 0.5 + offset.x, 0.0 + offset.y, 0.4, almostBottomCenter);
	};
	const offset = { x: 0, y: 0 };
	drawPokemon(false, offset);
	drawPokemon(true, offset);

	batch.setTransformMatrix(oldMatrix);
	batch.end();
	// gl.enable(gl.CULL_FACE);
}

export default BattleState;
