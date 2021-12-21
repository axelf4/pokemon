/** @file Implements on-screen touch controls. */

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
				right: 0; bottom: 0; left: 0;
				margin: 5vmin;
				justify-content: space-between; align-items: flex-end;
				opacity: 0.75;
				color: #212121;
				font-family: "open sans", sans-serif;

				user-select: none;
				-moz-user-select: none;
			}

			#controls *[data-key] {
				background: #333333;
				transition: all 0.5s cubic-bezier(.25, 1.7, .35, .8);
			}

			#controls *[data-key]:active {
				filter: brightness(2) drop-shadow(0 0 20px black);
			}

			#dpad {
				position: relative;
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				grid-auto-rows: auto;
				width: 45vmin; height: 45vmin;
				margin: 5vmin;
			}

			#dpad > * {
				position: relative;
				margin-top: 35%;
				border-radius: 0 0 15% 15%;
			}

			#dpad > *:after {
				content: "";
				position: absolute;
				bottom: 100%;
				left: 0; right: 0;
				padding-bottom: 35%;
				background: inherit;
				clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
			}

			#up { grid-column: 2; grid-row: 1; }
			#left { transform: rotate(270deg); grid-column: 1; grid-row: 2; }
			#right { transform: rotate(90deg); grid-column: 3; grid-row: 2; }
			#down { transform: rotate(180deg); grid-column: 2; grid-row: 3; }

			.action-buttons {
				position: relative;
				width: 45vmin;
				margin-right: 5vmin;
				align-self: stretch;
				display: flex;
				flex-direction: column;
				justify-content: space-around;
				font-size: xx-large; font-weight: 700;
			}

			.touch-button {
				border-radius: 50%; /* Make round */
				width: 20vmin; height: 20vmin;
				display: flex; justify-content: center; align-items: center;
			}

			.action-buttons > #aButton { align-self: flex-end; }
			.action-buttons > #bButton { align-self: flex-start; }
		</style>
		<div id="dpad" draggable="false">
			<div id="up" data-key="w"></div>
			<div id="left" data-key="a"></div>
			<div id="right" data-key="d"></div>
			<div id="down" data-key="s"></div>
		</div>
		<div class="action-buttons">
			<div id="aButton" class="touch-button" data-key=" ">A</div>
			<div id="bButton" class="touch-button" data-key="Shift">B</div>
		</div>
	`;
	controls.id = "controls";
	for (let [eventType, keyEvent] of [["pointerdown", "keydown"], ["pointerup", "keyup"], ["pointerout", "keyup"]]) {
		controls.addEventListener(eventType, event => {
			if (!(event.target && "key" in event.target.dataset)) return;
			window.dispatchEvent(new KeyboardEvent(keyEvent, { key: event.target.dataset.key }));
		});
	}
	document.body.appendChild(controls);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
else attach();
