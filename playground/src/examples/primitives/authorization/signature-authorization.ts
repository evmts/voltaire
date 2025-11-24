import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Signature-based Authorization
// Demonstrates signing, verification, and recovery

console.log("=== Signature-based Authorization ===\n");

// Delegate contract address
const delegate = Address.from("0x5aAeD5932B9EB3Cd462dDBAeFA21Da757F30FBD");

// Private key for signing
const privateKey = new Uint8Array(32);
privateKey.fill(3);

console.log("Creating Signed Authorization...\n");

// Create unsigned authorization
const unsigned = {
	chainId: 1n,
	address: delegate,
	nonce: 10n,
};

console.log("Unsigned Authorization:");
console.log("Chain:", unsigned.chainId);
console.log("Delegate:", Address.toHex(unsigned.address));
console.log("Nonce:", unsigned.nonce);
console.log();

// Hash the unsigned authorization
const authHash = Authorization.hash(unsigned);
console.log("Authorization Hash:");
console.log("0x" + Buffer.from(authHash).toString("hex"));
console.log();

// Sign the authorization
const signed = Authorization.sign(unsigned, privateKey);

console.log("Signature Components:");
console.log("yParity:", signed.yParity);
console.log(
	"r:",
	"0x" + Buffer.from(signed.r).toString("hex").slice(0, 16) + "...",
);
console.log(
	"s:",
	"0x" + Buffer.from(signed.s).toString("hex").slice(0, 16) + "...",
);
console.log();

// Validate signature format
try {
	Authorization.validate(signed);
	console.log("Signature Format: VALID");
	console.log("- yParity is 0 or 1");
	console.log("- r and s are non-zero");
	console.log("- s <= SECP256K1_N/2 (non-malleable)");
} catch (error) {
	console.log("Signature Format: INVALID");
	console.log("Error:", (error as Error).message);
}
console.log();

// Recover signer from signature
const recoveredAddress = Authorization.verify(signed);

console.log("Signature Recovery:");
console.log("Recovered Address:", Address.toHex(recoveredAddress));
console.log();

// Verify the signature matches expected signer
console.log("Signature Properties:");
console.log("Algorithm: ECDSA (secp256k1)");
console.log("Recovery: Deterministic from (r, s, yParity)");
console.log("Message: Keccak256(RLP([chainId, address, nonce]))");
console.log("Non-malleable: s <= N/2");
