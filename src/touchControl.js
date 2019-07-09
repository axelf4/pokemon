/** Implements on-screen touch controls. */

/** Heuristic for checking if we should display on-screen controls. */
function isTouchDevice() {
	return /(iphone|ipod|ipad|android|iemobile|blackberry|bada)/.test(navigator.userAgent.toLowerCase());
}

function attach() {
	if (!isTouchDevice()) return;

	let controls = document.createElement("div");
	controls.innerHTML = `
		<style>
			#controls {
				position: absolute;
				display: flex;
				top: 0;
				right: 0;
				bottom: 20px;
				left: 20px;
				align-items: flex-end;
				user-select: none;
			}

			#dpad {
				position: relative;
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				grid-auto-rows: auto;
				width: 45vmin; height: 45vmin;
				margin: 5vh;
			}

			#dpad > * {
				position: relative;
				/* width: 5vw; height: 10vh; */
				margin-top: 35%;

				background: #333333;
				opacity: 0.75;
				border-radius: 0 0 5px 5px;
				transition: all 0.5s cubic-bezier(.25, 1.7, .35, .8);
			}

			#dpad > *:after {
				content: "";
				position: absolute;
				bottom: 100%;
				left: 0; right: 0;
				padding-bottom: 35%;
				background: #333333;
				clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
			}

			#dpad > *:active {
				filter: brightness(2) drop-shadow(0 0 20px black);
			}

			#up { grid-column: 2; grid-row: 1; }
			#left { transform: rotate(270deg); grid-column: 1; grid-row: 2; }
			#right { transform: rotate(90deg); grid-column: 3; grid-row: 2; }
			#down { transform: rotate(180deg); grid-column: 2; grid-row: 3; }
		</style>
		<div id="dpad" draggable="false">
			<div id="up"></div>
			<div id="left"></div>
			<div id="right"></div>
			<div id="down"></div>
		</div>
	`;
	controls.id = "controls";
	document.body.appendChild(controls);

	let dpadElement = document.getElementById("dpad");
	for (let [eventType, keyEvent] of [["mousedown", "keydown"], ["mouseup", "keyup"], ["mouseout", "keyup"]]) {
		dpadElement.addEventListener(eventType, event => {
			if (!event.target) return;
			let key = null;
			switch (event.target.id) {
				case "up": key = "w"; break;
				case "left": key = "a"; break;
				case "down": key = "s"; break;
				case "right": key = "d"; break;
			}
			if (key === null) return;

			window.dispatchEvent(new KeyboardEvent(keyEvent, { key }));
		});
	}
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
else attach();
