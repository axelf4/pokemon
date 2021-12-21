import State from "State";
import Panel, {Direction, Align} from "./Panel";
import Container from "Container";
import Dialog from "Dialog";
var align = require("align.js");
import Select from "Select";
import NinePatch from "NinePatch";
import * as stateManager from "stateManager";
import Label from "./Label";
var Widget = require("Widget");
import * as measureSpec from "./measureSpec";
import Healthbar from "Healthbar";
var resources = require("resources.js");
import { Color } from "SpriteBatch";
import battle, { ActionType } from "battle";
import {mat4, vec3, quat} from "gl-matrix";
const renderer = require("renderer");
import TWEEN from "@tweenjs/tween.js";
import TransitionState, {fade} from "TransitionState";
import { listPokemon, modes } from "ListState";
import wait from "wait";
import {moveStats} from "./pokemon";
import moveAnimations from "./moveAnimations";

export default class BattleState extends State {
	constructor(loader, nextState, player, enemy) {
		super();
		this.nextState = nextState;

		(async () => {
			loader.load("assets/sprites/battleinfo.9.png").then(texRegion => {
				this.battleInfoTex = NinePatch.fromTextureRegion(texRegion);
			});
			loader.load("assets/sprites/battleground.png").then(texRegion => {
				this.groundTex = texRegion;
			});
			this.characterTex0 = loader.loadTexturePlaceholder("assets/sprites/pokemon/Slowpoke.png");
			this.characterTex1 = loader.loadTexturePlaceholder("assets/sprites/pokemon/Slowpoke.png");

			const widget = this.widget = new Panel(Direction.Column);

			const viewContainer = new Container();
			viewContainer.style.align = Align.Stretch;
			viewContainer.flex = 1;
			viewContainer.background = loader.loadTexturePlaceholder("assets/sprites/battlebg.png");
			widget.addWidget(viewContainer);

			const view = new Panel(Direction.Row, Align.SpaceAround);
			viewContainer.addWidget(view);

			await loader.all(); // Wait for resources to load

			const createInfoBox = isPlayer => {
				const container = new Container();
				container.background = this.battleInfoTex;
				container.marginTop = 20;
				view.addWidget(container);
				container.setVisible(false);

				const vPanel = new Panel(Direction.Column);
				vPanel.marginTop = 4;
				vPanel.marginRight = 12;
				vPanel.marginBottom = 7;
				vPanel.marginLeft = 4;
				container.addWidget(vPanel);

				const label = new Label(resources.font);
				label.style.align = align.STRETCH;
				vPanel.addWidget(label);

				const hpBar = new Healthbar(loader);
				hpBar.style.align = align.STRETCH;
				vPanel.addWidget(hpBar);

				let expLabel;
				if (isPlayer) {
					expLabel = new Label(resources.font);
					vPanel.addWidget(expLabel);
				}

				const setup = pokemon => {
					container.setVisible(true);
					label.setText(`${pokemon.name}  Lv.${pokemon.level}`);
					hpBar.setPercentage(pokemon.getHpPercentage(), false);
					if (isPlayer) {
						expLabel.setText(`Exp ${pokemon.exp} out of ${pokemon.getTotalExpForLevelUp()}`);
					}
				};
				return { hpBar, expLabel, setup };
			};
			const playerInfoBox = createInfoBox(true), enemyInfoBox = createInfoBox(false);

			var info = new Panel(Direction.Row);
			info.style.height = 100;
			widget.addWidget(info);

			const showDialog = function(text, options) {
				options = options || {};
				return new Promise(function(resolve, reject) {
					const passive = options.passive || options.showFor;

					info.removeAllWidgets();

					var dialog = new Dialog(text, resolve, passive);
					dialog.style.align = align.STRETCH;
					dialog.flex = 1;
					info.addWidget(dialog);
					dialog.requestFocus();
					if (options.showFor) {
						(async () => {
							do await wait(options.showFor);
							while (dialog.advance());
						})();
					}
				});
			};

			this.playerOffset = { x: 1, y: 0, a: 1 };
			this.enemyOffset = { x: 1, y: 0, a: 1 };

			await showDialog(`${enemy.getName()} wants to fight!`);

			const battleGen = battle(player, enemy);
			let nextArg;
			for (;;) {
				let {done, value: battleEvent} = battleGen.next(nextArg);
				nextArg = undefined;
				if (done) break;
				console.log("Battle event:", battleEvent);

				const object0 = battleEvent.isPlayer ? this.playerOffset : this.enemyOffset;
				const object1 = battleEvent.isPlayer ? this.enemyOffset : this.playerOffset;
				switch (battleEvent.type) {
					case "msgbox":
						let options = {};
						if (battleEvent.time) options.showFor = battleEvent.time;
						await showDialog(battleEvent.text, options);
						break;
					case "queryAction":
						let pokemon = battleEvent.pokemon;
						let playerAction = null;
						while (!playerAction) {
							var selected = await new Promise(function(resolve, reject) {
								var dialog = new Dialog(`What will ${pokemon.name} do?`, null, true);
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
									const moveId = await new Promise(function(resolve, reject) {
										const moveNames = pokemon.moves.map(move => moveStats(move.type).name);
										const select = new Select(moveNames, 2, resolve);
										select.style.align = align.STRETCH;
										select.flex = 1;
										info.addWidget(select);
										select.requestFocus();
									});
									info.removeAllWidgets();
									if (moveId !== -1) {
										const move = pokemon.moves[moveId];
										playerAction = { type: ActionType.Attack, move };
									}
									break;
								case 1: // Bag
									await showDialog("There's a time and place for everything, but not now...");
									break;
								case 2: // Pokemon
									let pokemonIndex = await listPokemon(loader, player, modes.choose);
									if (pokemonIndex !== -1)
										playerAction = { type: ActionType.SwitchPokemon, pokemonIndex };
									break;
								case 3: // Run
									if (enemy.canEscapeFrom())
										playerAction = { type: ActionType.Run };
									else
										await showDialog("No! There's no running from a Trainer battle!");
									break;
								default:
									throw new Error("Invalid selected value.");
							}
						}
						nextArg = playerAction;
						break;

					case "sendOut":
						if (battleEvent.oldPokemon) {
							showDialog(`Thats enough ${battleEvent.oldPokemon.name}! Get the fuck back here.`, {passive: true});
							await new Promise((resolve, reject) => {
								new TWEEN.Tween(object0).to({ x: [0, 1] }, 2000)
									.easing(TWEEN.Easing.Linear.None)
									.onComplete(resolve).start();
							});
							info.removeAllWidgets();
						}

						showDialog(`${battleEvent.isPlayer ? "Go" : `${enemy.getName()} sent out`} ${battleEvent.pokemon.name}!`, {passive: true});
						await new Promise((resolve, reject) => {
							new TWEEN.Tween(object0).to({
								x: [1, 0.25, 0],
								y: [0, -0.15, 0],
								a: [0, 1, 1],
							}, 2000)
								.interpolation(TWEEN.Interpolation.Bezier)
								.easing(TWEEN.Easing.Bounce.Out)
								.onComplete(resolve).start();
						});
						info.removeAllWidgets();
						(battleEvent.isPlayer ? playerInfoBox : enemyInfoBox).setup(battleEvent.pokemon);
						break;
					case "useMove":
						if (battleEvent.miss) {
							showDialog(`${battleEvent.pokemon.name} used ${moveStats(battleEvent.move).name}!`, {showFor: 1000});
							showDialog("But it missed.", {showFor: 1000});
						} else {
							showDialog(`${battleEvent.pokemon.name} used ${moveStats(battleEvent.move).name}!`, {passive: true});
							await moveAnimations[battleEvent.move](object0, object1);
						}
						break;
					case "faint":
						await Promise.all([
							new Promise((resolve, reject) => {
								new TWEEN.Tween(object0).to({ y: -0.3, a: 0, }, 2000)
									.easing(TWEEN.Easing.Linear.None)
									.onComplete(resolve).start();
							}),
							showDialog(`${battleEvent.isPlayer ? "" : "Foe "}${battleEvent.pokemon.name} fainted!`, {
								showFor: 1500,
							})
						]);
						if (battleEvent.promptForNext) {
							let pokemonIndex;
							do {
								pokemonIndex = await listPokemon(loader, player, modes.choose);
							} while (pokemonIndex === -1);
							nextArg = {type: ActionType.SwitchPokemon, pokemonIndex};
						}
						break;
					case "setHealth":
						let hpBar = (battleEvent.isPlayer ? playerInfoBox : enemyInfoBox).hpBar;
						await hpBar.setPercentage(battleEvent.percentage);
						break;
					case "gainExp":
						await new Promise((resolve, reject) => {
							new TWEEN.Tween({ exp: battleEvent.prevExp })
								.to({ exp: battleEvent.newExp }, 1000).easing(TWEEN.Easing.Quadratic.Out)
								.onUpdate(o => {
									playerInfoBox.expLabel.setText(`Exp ${o.exp | 0} out of ${battleEvent.pokemon.getTotalExpForLevelUp()}`);
								})
								.onComplete(resolve).onStop(reject).start();
						});
						break;
				}
			}

			console.log("Switching to next state.");
			const transition = new TransitionState(this, fade);
			stateManager.setState(transition);
			transition.transitionTo(nextState);
		})();
	}

	draw(batch, dt, time) {
		const gl = renderer.gl;

		if (this.widget && this.widget.isLayoutRequired()) {
			let widthMeasureSpec = measureSpec.make(this.width, measureSpec.Mode.Exactly),
				heightMeasureSpec = measureSpec.make(this.height, measureSpec.Mode.Exactly);
			this.widget.layout(widthMeasureSpec, heightMeasureSpec);
		}

		gl.disable(gl.CULL_FACE);
		batch.begin();
		this.widget.draw(batch, dt, time);
		const oldMatrix = batch.getTransformMatrix();

		const bottomCenter = (width, height) => [-width / 2, -height],
			almostBottomCenter = (width, height) => [-width / 2, -0.9 * height],
			middleCenter = (width, height) => [-width / 2, -height / 2];

		const drawPokemon = (flipped, offset, texture) => {
			const transform = mat4.fromRotationTranslationScale(mat4.create(), quat.create(),
				vec3.fromValues(this.width / 2, this.height / 2, 0),
				vec3.fromValues(this.width / 2 * (flipped ? -1 : 1), this.width / 2, 0));
			mat4.multiply(transform, oldMatrix, transform);
			batch.setTransformMatrix(transform);

			const draw = (tex, x, y, width, align, color) => {
				const {texture: {width: texWidth, height: texHeight}, u1, v1, u2, v2} = tex,
					  height = width * ((v2 - v1) * texHeight) / ((u2 - u1) * texWidth),
					  [ox, oy] = align(width, height);
				tex.draw(batch, x + ox, y + oy, x + ox + width, y + oy + height, color);
			};
			draw(this.groundTex, 0.5, 0.0, 0.7, middleCenter);
			draw(texture, 0.5 + offset.x, 0.0 + offset.y, 0.4, almostBottomCenter, Color.fromAlpha(offset.a));
		};
		drawPokemon(false, this.enemyOffset, this.characterTex1);
		drawPokemon(true, this.playerOffset, this.characterTex0);

		batch.setTransformMatrix(oldMatrix);
		batch.end();
		// gl.enable(gl.CULL_FACE);
	}
}

if (module.hot) {
	module.hot.accept("./moveAnimations");
}
