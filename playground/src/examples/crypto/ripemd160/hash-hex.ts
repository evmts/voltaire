import * as RIPEMD160 from "../../../crypto/RIPEMD160/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Hash hex strings directly
const hexData = "0xdeadbeef";
const hash = RIPEMD160.hashHex(hexData);
console.log("Hex input:", hexData);
console.log("RIPEMD160 hash:", Hex.fromBytes(hash));

// Works with or without 0x prefix
const withoutPrefix = RIPEMD160.hashHex("cafebabe");
console.log("\nWithout 0x prefix:", Hex.fromBytes(withoutPrefix));

// Hash public key hex
const pubKeyHex =
	"0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
const pubKeyHash = RIPEMD160.hashHex(pubKeyHex);
console.log("\nPublic key hex hash:", Hex.fromBytes(pubKeyHash));

// Empty hex
const emptyHash = RIPEMD160.hashHex("0x");
console.log("\nEmpty hex hash:", Hex.fromBytes(emptyHash));
