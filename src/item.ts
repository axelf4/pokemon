enum Item {
	Pokeball,
	Potion,
}

export function getName(item: Item): string {
	switch (item) {
		case Item.Pokeball: return "Pokeball";
		case Item.Potion: return "Potion";
	}
}

export default Item;
