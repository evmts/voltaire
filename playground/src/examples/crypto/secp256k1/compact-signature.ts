// Compact signature format (65 bytes)
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Create and sign message
const messageHash = Hash.keccak256String("Compact signature test");
const privateKey = Secp256k1.PrivateKey.random();
const signature = Secp256k1.sign(messageHash, privateKey);

console.log("Standard signature:");
console.log("  r:", signature.r.length, "bytes");
console.log("  s:", signature.s.length, "bytes");
console.log("  yParity:", signature.yParity);

// Convert to compact format (r + s + v = 65 bytes)
const compact = Secp256k1.Signature.toCompact(signature);
console.log("\nCompact format:", Hex.from(compact).toString());
console.log("Compact length:", compact.length, "bytes (r[32] + s[32] + v[1])");

// Convert back from compact
const fromCompact = Secp256k1.Signature.fromCompact(compact);
console.log("\nRound-trip match:");
console.log(
	"  r matches:",
	signature.r.every((b, i) => b === fromCompact.r[i]),
);
console.log(
	"  s matches:",
	signature.s.every((b, i) => b === fromCompact.s[i]),
);
console.log("  yParity matches:", signature.yParity === fromCompact.yParity);
