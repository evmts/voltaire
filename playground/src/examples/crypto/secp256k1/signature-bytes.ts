// Signature serialization to bytes
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Create signature
const messageHash = Hash.keccak256String("Serialize signature");
const privateKey = Secp256k1.PrivateKey.random();
const signature = Secp256k1.sign(messageHash, privateKey);

console.log("Original signature:");
console.log("  r:", Hex.from(signature.r).toString());
console.log("  s:", Hex.from(signature.s).toString());
console.log("  yParity:", signature.yParity);

// Serialize to bytes (64 bytes: r + s)
const bytes = Secp256k1.Signature.toBytes(signature);
console.log("\nSerialized bytes:", Hex.from(bytes).toString());
console.log("Length:", bytes.length, "bytes (r[32] + s[32])");

// Deserialize from bytes (needs yParity separately)
const fromBytes = Secp256k1.Signature.fromBytes(bytes, signature.yParity);
console.log("\nDeserialized:");
console.log(
	"  r matches:",
	signature.r.every((b, i) => b === fromBytes.r[i]),
);
console.log(
	"  s matches:",
	signature.s.every((b, i) => b === fromBytes.s[i]),
);
console.log("  yParity matches:", signature.yParity === fromBytes.yParity);
