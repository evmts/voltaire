import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Authorization basics (EIP-7702)
// EIP-7702 allows EOAs to delegate code execution to a contract address

// Create a basic unsigned authorization
const unsigned = {
	chainId: 1n, // Mainnet
	address: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	nonce: 0n,
};

console.log("=== EIP-7702 Authorization Basics ===\n");

console.log("Unsigned Authorization:");
console.log("Chain ID:", unsigned.chainId);
console.log("Delegate Address:", Address.toHex(unsigned.address));
console.log("Nonce:", unsigned.nonce);
console.log();

// Create a private key for signing (example only, never hardcode in production)
const privateKey = new Uint8Array(32);
privateKey.fill(1);

// Sign the authorization
const signed = Authorization.sign(unsigned, privateKey);

console.log("Signed Authorization:");
console.log("Chain ID:", signed.chainId);
console.log("Delegate Address:", Address.toHex(signed.address));
console.log("Nonce:", signed.nonce);
console.log("yParity:", signed.yParity);
console.log("r:", "0x" + Buffer.from(signed.r).toString("hex"));
console.log("s:", "0x" + Buffer.from(signed.s).toString("hex"));
console.log();

// Validate the authorization
try {
	Authorization.validate(signed);
	console.log("Validation: PASSED");
} catch (error) {
	console.log("Validation: FAILED -", (error as Error).message);
}
console.log();

// Verify the signature
try {
	const recovered = Authorization.verify(signed);
	console.log("Signature Recovery:");
	console.log("Recovered Address:", Address.toHex(recovered));
	console.log("Verification: PASSED");
} catch (error) {
	console.log("Verification: FAILED -", (error as Error).message);
}
console.log();

// Format for display
const formatted = Authorization.format(signed);
console.log("Formatted:");
console.log(formatted);
console.log();

// Gas cost calculation
const gasCost = Authorization.getGasCost(signed, true); // true = empty account
console.log("Gas Cost (empty account):", gasCost);
console.log("- Base cost:", Authorization.PER_AUTH_BASE_COST);
console.log("- Empty account cost:", Authorization.PER_EMPTY_ACCOUNT_COST);
