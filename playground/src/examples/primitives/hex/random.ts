import * as Hex from "../../../primitives/Hex/index.js";

// Generate random hex values
const random4 = Hex.random(4);
console.log("Random 4 bytes:", random4.toString());
console.log("Size:", random4.size(), "bytes");

const random32 = Hex.random(32);
console.log("\nRandom 32 bytes:", random32.toString());
console.log("Size:", random32.size(), "bytes");

// Generate multiple random values
console.log("\nMultiple random 8-byte values:");
for (let i = 0; i < 3; i++) {
	const rand = Hex.random(8);
	console.log(`  ${i + 1}:`, rand.toString());
}

// Random nonce
const nonce = Hex.random(8);
console.log("\nRandom nonce:", nonce.toString());
console.log("As number:", nonce.toNumber());

// Random salt for commitment scheme
const salt = Hex.random(32);
console.log("\nRandom salt:", salt.toString());
