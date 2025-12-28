import { Hex } from "voltaire";
// Generate random hex values
const random4 = Hex.random(4);

const random32 = Hex.random(32);
for (let i = 0; i < 3; i++) {
	const rand = Hex.random(8);
}

// Random nonce
const nonce = Hex.random(8);

// Random salt for commitment scheme
const salt = Hex.random(32);
