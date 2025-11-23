import * as Hex from "../../../primitives/Hex/index.js";

// Generate random hex values
const random4 = Hex.random(4);
console.log("Random 4 bytes:", random4);
console.log("Size:", Hex.size(random4), "bytes");

const random32 = Hex.random(32);
console.log("\nRandom 32 bytes:", random32);
console.log("Size:", Hex.size(random32), "bytes");

// Generate multiple random values
console.log("\nMultiple random 8-byte values:");
for (let i = 0; i < 3; i++) {
	const rand = Hex.random(8);
	console.log(`  ${i + 1}:`, rand);
}

// Random nonce
const nonce = Hex.random(8);
console.log("\nRandom nonce:", nonce);
console.log("As number:", Hex.toNumber(nonce));

// Random salt for commitment scheme
const salt = Hex.random(32);
console.log("\nRandom salt:", salt);
