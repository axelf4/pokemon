import State from "State";
import * as stateManager from "stateManager";
const Stack = require("Stack");
const Panel = require("Panel");
import Select from "Select";
const align = require("align");
const resources = require("resources");
const Image = require("Image");
const Label = require("Label");
const Healthbar = require("Healthbar");
import swapElements from "swapElements";
import TransitionState, {fade} from "TransitionState";

export const modes = Object.freeze({
	list: Symbol("list"),
	choose: Symbol("choose"),
});

export default class ListPokemonState extends State {
	constructor(loader, trainer, mode = modes.list) {
		super();
		this.widget = new Stack();
		let switching = -1; // Index of pokemon currently switching or -1

		const contextPanel = new Panel();
		contextPanel.justify = Panel.ALIGN_FLEX_END;

		const self = this;
		(function rebuildUi() {
			self.widget.removeAllWidgets();

			const contents = trainer.pokemon.map(pokemon => {
				const panel = new Panel();
				panel.direction = Panel.DIRECTION_ROW;

				const icon = new Image(null);
				loader.loadTexture("assets/pokemon/Slowpoke.png").then(region => {
					icon.setRegion(region);
				});
				icon.style.width = icon.style.height = 35;
				icon.marginRight = 10;
				panel.addWidget(icon);

				const vert = new Panel();
				vert.jusify = Panel.ALIGN_SPACE_AROUND;
				vert.direction = Panel.DIRECTION_COLUMN;
				vert.style.align = align.CENTER;
				// vert.flex = 1;
				panel.addWidget(vert);

				const nameLabel = new Label(resources.font, `${pokemon.name} Lv. ${pokemon.level}`);
				nameLabel.marginBottom = 5;
				vert.addWidget(nameLabel);

				const healthbar = new Healthbar(loader, pokemon.getHpPercentage());
				healthbar.style.align = align.STRETCH;
				healthbar.style.width = 170;
				vert.addWidget(healthbar);

				return panel;
			});

			contents.push(new Label(resources.font, "Exit"));

			const select = new Select(contents, 1, selected => {
				if (selected === contents.length - 1) {
					// Exit was selected
					self.callback(-1);
					return;
				}

				if (switching !== -1) {
					if (switching === selected) {
						return; // Can't switch with itself
					}
					swapElements(trainer.pokemon, switching, selected);
					switching = -1;
					rebuildUi();
					return;
				}

				const contextMenu = new Select([mode === modes.list ? "Switch" : "Send out", "Exit"], 1, selectedOption => {
					contextPanel.removeAllWidgets();
					if (selectedOption === 0 && trainer.pokemon[selected].hp > 0) {
						switch (mode) {
							case modes.list:
								switching = selected;
								break;
							case modes.choose:
								self.callback(selected);
								return;
						}
					}
				});
				contextMenu.style.align = align.END;
				contextPanel.addWidget(contextMenu);
				contextMenu.requestFocus();
			});
			select.flex = 1;
			select.style.align = align.STRETCH;
			select.margin(10);
			self.widget.addWidget(select);
			select.requestFocus();

			self.widget.addWidget(contextPanel);
		})();
	}

	setCloseCallback(callback) {
		this.callback = callback;
	}
}

export function switchPokemon(loader, trainer) {
	const lastState = stateManager.getState();
	return new Promise(resolve => {
		const listState = new ListPokemonState(loader, trainer, modes.choose);
		listState.setCloseCallback(resolve);

		const transition = new TransitionState(lastState, fade);
		stateManager.setState(transition);
		loader.all().then(() => { transition.transitionTo(listState); });
	}).finally(() => { stateManager.setState(lastState); });
}
