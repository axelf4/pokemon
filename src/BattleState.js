import State from "State";
var Panel = require("Panel.js");
var Container = require("Container.js");
var Dialog = require("Dialog.js");
var align = require("align.js");
var texture = require("texture.js");
var Image = require("Image.js");
var Select = require("Select.js");
import NinePatch from "NinePatch";
import thread from "thread";
import * as stateManager from "stateManager";
var pokemon = require("pokemon.js");
var Label = require("Label.js");
var Widget = require("Widget");
var measureSpec = require("measureSpec");
const Healthbar = require("Healthbar.js");
var resources = require("resources.js");
import { Color } from "SpriteBatch";
import battle, { battleEventText, battleEventQueryAction,
	battleEventDeployPokemon, battleEventUseMove,
	battleEventSetHealth, battleEventFaint,
	actionAttack, actionRun } from "battle";
const glMatrix = require("gl-matrix");
const renderer = require("renderer");
const TWEEN = require("@tweenjs/tween.js");

const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;

export default class BattleState extends State {
	constructor(loader, nextState, player, enemy) {
		super();
		this.nextState = nextState;
		const self = this;

		thread(function*() {
			loader.loadTexture("textures/battleinfo.9.png").then(texRegion => {
				self.battleInfoTex = NinePatch.fromTextureRegion(texRegion);
			});
			loader.loadTexture("assets/battleground.png").then(texRegion => {
				self.groundTex = texRegion;
			});
			loader.loadTexture("assets/pokemon/Slowpoke.png").then(region => {
				self.pokemon0Tex = region;
			});
			yield loader.all();

			const widget = self.widget = new Panel();
			widget.direction = Panel.DIRECTION_COLUMN;

			const viewContainer = new Container();
			viewContainer.style.align = align.STRETCH;
			viewContainer.flex = 1;
			loader.loadTexture("assets/battlebg.png").then(texRegion => {
				viewContainer.background = texRegion;
			});
			widget.addWidget(viewContainer);

			const view = new Panel();
			view.direction = Panel.DIRECTION_ROW;
			view.justify = align.SPACE_AROUND;
			viewContainer.addWidget(view);

			const createInfoBox = () => {
				const container = new Container();
				container.background = self.battleInfoTex;
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

			self.playerOffset = { x: 0, y: 0, a: 1 };
			self.enemyOffset = { x: 0, y: 0, a: 1 };

			const battleGen = battle(player, enemy);

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
						const object0 = eventVal.isPlayer ? self.playerOffset : self.enemyOffset;
						const object1 = eventVal.isPlayer ? self.enemyOffset : self.playerOffset;
						yield new Promise((resolve, reject) => {
							new TWEEN.Tween(object0)
								.to({
									x: [ 0.05, 0.08, 0.10, -0.2, object0.x ],
									y: [ 0.05, 0.07, 0.08, 0, object0.y ],
								}, 1000)
							.interpolation(TWEEN.Interpolation.CatmullRom)
								.easing(TWEEN.Easing.Linear.None)
								.chain(new TWEEN.Tween(object1)
										.to({
											x: [ 0.1, 0.11, object1.x ],
											y: [ -0.03, -0.01, object1.y ],
										}, 1000)
										.interpolation(TWEEN.Interpolation.CatmullRom)
										.easing(TWEEN.Easing.Linear.None)
										.delay(100)
										.onComplete(resolve))
								.start();
						});
						break;
					case battleEventFaint:
						const object = eventVal.isPlayer ? self.playerOffset : self.enemyOffset;
						const objectCopy = { ...object };
						yield new Promise((resolve, reject) => {
							new TWEEN.Tween(object).to({ y: -0.3, a: 0, }, 2000)
								.easing(TWEEN.Easing.Linear.None)
								.onComplete(() => {
									// Object.assign(object, objectCopy);
									resolve();
								}).start();
						});
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
	}

	draw(batch, dt, time) {
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
			const color = new Color(1, 1, 1, offset.a);

			const draw = (tex, x, y, width, align, color) => {
				const height = width * (tex.y1 - tex.y0) / (tex.x1 - tex.x0);
				const [ox, oy] = align(width, height);
				tex.draw(batch, x + ox, y + oy, width, height, color);
			};

			draw(this.groundTex, 0.5, 0.0, 0.7, middleCenter);
			draw(this.pokemon0Tex, 0.5 + offset.x, 0.0 + offset.y, 0.4, almostBottomCenter, color);
		};
		drawPokemon(false, this.enemyOffset);
		drawPokemon(true, this.playerOffset);

		batch.setTransformMatrix(oldMatrix);
		batch.end();
		// gl.enable(gl.CULL_FACE);
	}
}
