import { Move } from "./pokemon";
import TWEEN from "@tweenjs/tween.js";

interface AnimatableObject {
	x: number;
	y: number;
	a: number;
}

export interface MoveAnimation {
	(attacker: AnimatableObject, defender: AnimatableObject): Promise<void | Object>;
}

const moveAnimations: {[K in Move]: MoveAnimation} = {
	[Move.Tackle](attacker, defender) {
		return new Promise((resolve, reject) => {
			new TWEEN.Tween(attacker)
				.to({
					x: [ 0.05, 0.08, 0.10, -0.2, attacker.x ],
					y: [ 0.05, 0.07, 0.08, 0, attacker.y ],
				}, 1000)
				.interpolation(TWEEN.Interpolation.CatmullRom)
				.easing(TWEEN.Easing.Linear.None)
				.chain(new TWEEN.Tween(defender)
				.to({
					x: [ 0.1, 0.11, defender.x ],
					y: [ -0.03, -0.01, defender.y ],
				}, 1000)
				.interpolation(TWEEN.Interpolation.CatmullRom)
				.easing(TWEEN.Easing.Linear.None)
				.delay(100)
				.onComplete(resolve)).start();
		});
	},

	async [Move.Growl](attacker, defender) {
		throw new Error("Not yet implemented");
	},
};
export default moveAnimations;
