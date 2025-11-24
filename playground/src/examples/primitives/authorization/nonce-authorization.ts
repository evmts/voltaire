import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Nonce-based Authorization
// Nonces prevent replay attacks

console.log("=== Nonce-based Authorization ===\n");

const delegate = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const privateKey = new Uint8Array(32).fill(1);

console.log("Account Nonce Progression:\n");

// Create authorizations with sequential nonces
const auths = [];
for (let i = 0; i < 5; i++) {
	const auth = Authorization.sign(
		{
			chainId: 1n,
			address: delegate,
			nonce: BigInt(i),
		},
		privateKey,
	);
	auths.push(auth);
}

// Display nonce sequence
auths.forEach((auth, i) => {
	const signer = Authorization.verify(auth);
	console.log(`Nonce ${i}:`);
	console.log("  Signer:", Address.toHex(signer).slice(0, 10) + "...");
	console.log("  Delegate:", Address.toHex(auth.address).slice(0, 10) + "...");
	console.log(
		"  Hash:",
		"0x" +
			Buffer.from(Authorization.hash(auth)).toString("hex").slice(0, 16) +
			"...",
	);
});
console.log();

// Nonces are unique to each account
console.log("Nonce Properties:");
console.log("- Sequential counter per account");
console.log("- Starts at 0 for new accounts");
console.log("- Increments with each transaction");
console.log("- Prevents replay of old authorizations");
console.log();

// Large nonce values
const largeNonce = Authorization.sign(
	{
		chainId: 1n,
		address: delegate,
		nonce: 999999999999n,
	},
	privateKey,
);

console.log("Large Nonce Authorization:");
console.log("Nonce:", largeNonce.nonce);
console.log("Valid:", !isNaN(Number(largeNonce.nonce)));
console.log();

// Maximum nonce value
const maxNonce = 2n ** 64n - 1n;
const maxNonceAuth = Authorization.sign(
	{
		chainId: 1n,
		address: delegate,
		nonce: maxNonce,
	},
	privateKey,
);

console.log("Maximum Nonce Authorization:");
console.log("Nonce:", maxNonceAuth.nonce);
try {
	Authorization.validate(maxNonceAuth);
	console.log("Validation: PASSED");
} catch (error) {
	console.log("Validation: FAILED");
}
console.log();

// Comparison of different nonces
console.log("Nonce Comparison:");
const auth1 = auths[0];
const auth2 = auths[1];
const auth3 = Authorization.sign(
	{
		chainId: 1n,
		address: delegate,
		nonce: 0n, // Same nonce as auth1
	},
	privateKey,
);

console.log(
	"Auth1 (nonce=0) equals Auth2 (nonce=1):",
	Authorization.equalsAuth(auth1, auth2),
);
console.log(
	"Auth1 (nonce=0) equals Auth3 (nonce=0):",
	Authorization.equalsAuth(auth1, auth3),
);
console.log();

console.log("Use Case:");
console.log("Account at nonce 5 creates authorization with nonce 5.");
console.log("After transaction, account nonce becomes 6.");
console.log("Old authorization (nonce 5) cannot be replayed.");
