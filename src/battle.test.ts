import battle from "./battle";
import Trainer from "./Trainer";
import Pokemon, {pokemons, moves} from "./pokemon";

test("should send out primary pokemon", () => {
	let pokemonA = new Pokemon(pokemons.slowpoke, 1), trainerA = new Trainer("A", [pokemonA]),
		pokemonB = new Pokemon(pokemons.slowpoke, 2), trainerB = new Trainer("B", [pokemonB]);
	let battleGen = battle(trainerA, trainerB);
	expect(battleGen.next()).toEqual({done: false, value: {
		type: "sendOut", isPlayer: false, pokemon: pokemonB, oldPokemon: null
	}});
	expect(battleGen.next()).toEqual({done: false, value: {
		type: "sendOut", isPlayer: true, pokemon: pokemonA, oldPokemon: null
	}});
});
