import Trainer from "./Trainer";
import Pokemon, {pokemons} from "./pokemon";

test("primary pokemon is first healthy in order", () => {
	let foo = new Pokemon(pokemons.slowpoke, 1),
		bar = new Pokemon(pokemons.slowpoke, 2);
	let trainer = new Trainer("A", [foo, bar]);
	expect(trainer.getPrimaryPokemon()).toBe(foo);
	foo.hp = 0;
	expect(trainer.getPrimaryPokemon()).toBe(bar);
	bar.hp = 0;
	expect(trainer.getPrimaryPokemon()).toBeUndefined();
});
