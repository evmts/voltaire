import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Authorization Comparison and Equality
// Comparing authorizations for deduplication and caching

console.log("=== Authorization Comparison ===\n");

const delegate1 = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const delegate2 = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const privateKey = new Uint8Array(32).fill(1);

// Create base authorization
const auth1 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate1,
		nonce: 0n,
	},
	privateKey,
);

console.log("Base Authorization:");
console.log(Authorization.format(auth1));
console.log();

// Create identical authorization
const auth2 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate1,
		nonce: 0n,
	},
	privateKey,
);

// Create different authorizations
const auth3 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate2, // Different delegate
		nonce: 0n,
	},
	privateKey,
);

const auth4 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate1,
		nonce: 1n, // Different nonce
	},
	privateKey,
);

const auth5 = Authorization.sign(
	{
		chainId: 2n, // Different chain
		address: delegate1,
		nonce: 0n,
	},
	privateKey,
);

console.log("Equality Tests:\n");

console.log(
	"auth1 equals auth2 (identical):",
	Authorization.equalsAuth(auth1, auth2),
);
console.log(
	"auth1 equals auth3 (different delegate):",
	Authorization.equalsAuth(auth1, auth3),
);
console.log(
	"auth1 equals auth4 (different nonce):",
	Authorization.equalsAuth(auth1, auth4),
);
console.log(
	"auth1 equals auth5 (different chain):",
	Authorization.equalsAuth(auth1, auth5),
);
console.log();

// Self comparison
console.log("Self Comparison:");
console.log("auth1 equals auth1:", Authorization.equalsAuth(auth1, auth1));
console.log();

// Field-by-field comparison
console.log("Field Comparison (auth1 vs auth3):");
console.log("- Chain ID:", auth1.chainId === auth3.chainId);
console.log("- Address:", Address.equals(auth1.address, auth3.address));
console.log("- Nonce:", auth1.nonce === auth3.nonce);
console.log("- yParity:", auth1.yParity === auth3.yParity);
console.log("- r:", Buffer.from(auth1.r).equals(Buffer.from(auth3.r)));
console.log("- s:", Buffer.from(auth1.s).equals(Buffer.from(auth3.s)));
console.log();

// Deduplication use case
console.log("Deduplication Example:\n");

const authList = [auth1, auth2, auth3, auth1, auth4, auth3];
console.log("Original list size:", authList.length);

const deduplicated = authList.filter(
	(auth, index) =>
		authList.findIndex((a) => Authorization.equalsAuth(a, auth)) === index,
);

console.log("Deduplicated size:", deduplicated.length);
console.log();

// Display unique authorizations
console.log("Unique Authorizations:");
deduplicated.forEach((auth, i) => {
	console.log(
		`${i + 1}. Chain: ${auth.chainId}, Nonce: ${auth.nonce}, Delegate: ${Address.toHex(auth.address).slice(0, 10)}...`,
	);
});
console.log();

// Use case description
console.log("Use Cases:");
console.log("- Deduplicating authorization lists");
console.log("- Caching signed authorizations");
console.log("- Validating no duplicates in transaction");
console.log("- Comparing authorizations across transactions");
