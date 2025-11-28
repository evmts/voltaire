// Address: Creating and validating Ethereum addresses
import { Address } from "../../../src/primitives/Address/index.js";
import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";

// Address extends Uint8Array - can use as bytes directly
const addr = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("instanceof Uint8Array:", addr instanceof Uint8Array);
console.log("Length:", addr.length, "bytes");
console.log("First byte:", addr[0]);

// === CREATION METHODS ===
// From various formats
const fromHex = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const fromBytes = Address.fromBytes(new Uint8Array(20));
const fromNumber = Address.fromNumber(0x742d35n);
const fromBase64 = Address.fromBase64("dC01zGY0wFMpJaO4RLxFTkQ49E4=");
const zero = Address.zero();

// From crypto keys
const privateKey = crypto.getRandomValues(new Uint8Array(32));
const publicKey = Secp256k1.derivePublicKey(privateKey);
const fromPubKey = Address.fromPublicKey(publicKey);
const fromPrivKey = Address.fromPrivateKey(privateKey);

console.log("\n=== Creation ===");
console.log("From hex:", fromHex.toHex());
console.log("Zero address:", zero.toHex());
console.log("From public key:", fromPubKey.toHex());
console.log("From private key:", fromPrivKey.toHex());
console.log("Keys match:", fromPubKey.equals(fromPrivKey));

// === INSTANCE METHODS: Conversion ===
console.log("\n=== Conversion Methods ===");
console.log("toHex():", addr.toHex());
console.log("toLowercase():", addr.toLowercase());
console.log("toUppercase():", addr.toUppercase());
console.log("toShortHex():", addr.toShortHex());
console.log("toShortHex(6,4):", addr.toShortHex(6, 4));
console.log("toBytes():", addr.toBytes());
console.log("toU256():", addr.toU256());
console.log("toAbiEncoded():", addr.toAbiEncoded());

// === INSTANCE METHODS: Comparison ===
console.log("\n=== Comparison Methods ===");
const addr2 = Address("0x742d35cc6634c0532925a3b844bc454e4438f44e");
console.log("equals(addr2):", addr.equals(addr2)); // case insensitive
console.log("compare(addr2):", addr.compare(addr2));
console.log("lessThan(zero):", addr.lessThan(zero));
console.log("greaterThan(zero):", addr.greaterThan(zero));

// === INSTANCE METHODS: Utilities ===
console.log("\n=== Utility Methods ===");
console.log("isZero():", addr.isZero());
console.log("clone():", addr.clone().toHex());

// === STATIC METHODS ===
console.log("\n=== Static Validation ===");
console.log(
	"Address.isValid(valid hex):",
	Address.isValid("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
);
console.log("Address.isValid(invalid):", Address.isValid("0xinvalid"));
console.log("Address.is():", Address.is(addr)); // type guard

// Direct Uint8Array access
console.log("\n=== Uint8Array Access ===");
console.log("Slice first 4 bytes:", addr.slice(0, 4));
console.log("Iterate bytes:", [...addr.slice(0, 4)]);
