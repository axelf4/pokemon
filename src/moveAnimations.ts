import { Move } from "./pokemon";
import TWEEN from "@tweenjs/tween.js";
import {type TexRegion} from "./texture";

interface AnimatableObject {
	x: number;
	y: number;
	width: number;
	a: number;
	texture: TexRegion;
	rotation: number;
}

export interface MoveAnimation {
	(loader: any, attacker: AnimatableObject, defender: AnimatableObject,
	 attackerScene: AnimatableObject[], defenderScene: AnimatableObject[]): Promise<void | Object>;
}

const moveAnimations: {[K in Move]: MoveAnimation} = {
	[Move.Tackle](loader, attacker, defender, attackerScene, defenderScene) {
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

	async [Move.Growl](loader, attacker, defender, attackerScene, defenderScene) {
		let roarTexture = (await loader.load("assets/sprites/attacks/roar.png")).flipped(true, false);
		let obj = { texture: roarTexture, x: attacker.x - 0.2, y: attacker.y, width: 0, rotation: 0, a: 0 };
		attackerScene.push(obj);
		await new Promise((resolve, reject) => {
			new TWEEN.Tween(obj).to({
				width: [0.2],
				a: [1],
			}, 3000)
				.easing(TWEEN.Easing.Bounce.In)
				.onComplete(resolve).start();
		});
		attackerScene.length = 0;
	},
};
export default moveAnimations;
