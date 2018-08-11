import State from "State";
const Stack = require("Stack");
const Panel = require("Panel");
import Select from "Select";
const align = require("align");
const resources = require("resources");
const Image = require("Image");
const Label = require("Label");
const Healthbar = require("Healthbar");
import swapElements from "swapElements";

export default class ListPokemonState extends State {
	constructor(loader, trainer) {
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

				const healthbar = new Healthbar(loader);
				healthbar.style.align = align.STRETCH;
				healthbar.style.width = 170;
				vert.addWidget(healthbar);

				return panel;
			});

			contents.push(new Label(resources.font, "Exit"));

			const select = new Select(contents, 1, selected => {
				if (selected === contents.length - 1) {
					// Exit was selected
					self.callback();
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

				const contextMenu = new Select(["Switch", "Exit"], 1, selectedOption => {
					contextPanel.removeAllWidgets();
					if (selectedOption === 0) { // Switch
						switching = selected;
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
