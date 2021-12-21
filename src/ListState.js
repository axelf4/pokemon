import State from "State";
import {KeyAction} from "input";
import * as stateManager from "stateManager";
import Stack from "Stack";
import Panel from "Panel";
import Select from "Select";
const align = require("align");
const resources = require("resources");
import swapElements from "swapElements";
import Label from "./Label";
import Image from "./Image";
import Healthbar from "Healthbar";
import clamp from "clamp";
import LoadGuard from "LoadGuard";
import {getName as getItemName} from "./item";

/** Enumeration of possible ListState modes. */
export const modes = Object.freeze({
	/** Just listing the items. */
	list: Symbol("list"),
	/** Showing all items in order for user to choose one. */
	choose: Symbol("choose"),
});

const numItemsPerPage = 3;

export default class ListState extends State {
	constructor(loader, items, mode = modes.list) {
		super();
		if (new.target === ListState) throw new TypeError("Abstract class cannot be instantiated.");

		this.widget = new Stack();
		this.callback = null;
		let switchingIndex = -1; // Index of pokemon currently switching or -1

		const contextPanel = new Panel();
		contextPanel.justify = Panel.ALIGN_FLEX_END;

		this.page = 0;
		this.maxPages = Math.ceil(items.length / numItemsPerPage);
		(this.rebuildUi = () => {
			this.widget.removeAllWidgets();
			const mainPanel = new Panel();
			mainPanel.direction = Panel.DIRECTION_COLUMN;
			const pageLabel = new Label(resources.font, `Page ${this.page + 1} of ${this.maxPages}`)
			pageLabel.style.align = Panel.ALIGN_CENTER;
			mainPanel.addWidget(pageLabel);

			const contents = items.slice(numItemsPerPage * this.page, numItemsPerPage * (this.page + 1))
				.map(this.itemToWidget.bind(this, loader));
			contents.push(new Label(resources.font, "Exit"));

			const select = new Select(contents, 1, selected => {
				if (selected === -1 // No option was selected
					|| selected === contents.length - 1) { // Exit was selected
					this.callback(-1);
					return;
				}

				const itemIndex = selected === -1 ? -1 : numItemsPerPage * this.page + selected;

				if (switchingIndex !== -1) {
					if (switchingIndex === itemIndex) {
						return; // Can't switch with itself
					}
					swapElements(items, switchingIndex, itemIndex);
					switchingIndex = -1;
					this.rebuildUi();
					return;
				}

				const contextMenu = new Select([mode === modes.list ? "Switch" : "Choose", "Exit"], 1, selectedOption => {
					contextPanel.removeAllWidgets();
					if (selectedOption === 0) { // Switch/Choose
						switch (mode) {
							case modes.list:
								switchingIndex = itemIndex;
								break;
							case modes.choose:
								// TODO Add option to show text and disallow choice
								this.callback(itemIndex);
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
			mainPanel.addWidget(select);

			this.widget.addWidget(new LoadGuard(loader, mainPanel));
			this.widget.addWidget(contextPanel);

			this.widget.requestFocus();
		})();
	}

	setCloseCallback(callback) {
		this.callback = callback;
	}

	onKey(type, key) {
		if (type == KeyAction.Down) {
			const prevPage = this.page;
			switch (key) {
				case "a": --this.page; break;
				case "d": ++this.page; break;
			}
			this.page = clamp(this.page, 0, this.maxPages - 1);

			if (this.page !== prevPage) {
				this.rebuildUi();
				return;
			}
		}

		super.onKey(type, key);
	}
}

function showListState(loader, listState) {
	const prevState = stateManager.getState();
	return new Promise(resolve => {
		listState.setCloseCallback(resolve);
		stateManager.setState(listState);
	}).finally(() => { stateManager.setState(prevState); });
}

export class ListPokemonState extends ListState {
	constructor(loader, pokemon, ...args) {
		super(loader, pokemon, ...args);
	}

	itemToWidget(loader, pokemon) {
		const panel = new Panel();
		panel.direction = Panel.DIRECTION_ROW;

		const icon = new Image(null);
		loader.load("assets/pokemon/Slowpoke.png").then(region => {
			icon.setRegion(region);
		});
		icon.style.width = icon.style.height = 35;
		icon.marginRight = 10;
		panel.addWidget(icon);

		const vert = new Panel();
		vert.jusify = Panel.ALIGN_SPACE_AROUND;
		vert.direction = Panel.DIRECTION_COLUMN;
		vert.style.align = align.CENTER;
		panel.addWidget(vert);

		const nameLabel = new Label(resources.font, `${pokemon.name} Lv. ${pokemon.level}`);
		nameLabel.marginBottom = 5;
		vert.addWidget(nameLabel);

		const healthbar = new Healthbar(loader, pokemon.getHpPercentage());
		healthbar.style.align = align.STRETCH;
		healthbar.style.width = 170;
		vert.addWidget(healthbar);

		return panel;
	}
}

export function listPokemon(loader, trainer, mode = modes.list) {
	return showListState(loader,
		new ListPokemonState(loader, trainer.pokemons, mode));
}

export class ListItemState extends ListState {
	constructor(loader, items, ...args) {
		super(loader, items, ...args);
	}

	itemToWidget(loader, item) {
		const nameLabel = new Label(resources.font, `${getItemName(item)}`);
		return nameLabel;
	}
}

export function listItems(loader, trainer) {
	return showListState(loader,
		new ListItemState(loader, trainer.items));
}
