import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Multiple Authorizations in One Transaction
// Shows batch processing and gas calculation

console.log("=== Multiple Authorizations ===\n");

// Different EOA private keys
const key1 = new Uint8Array(32).fill(1);
const key2 = new Uint8Array(32).fill(2);
const key3 = new Uint8Array(32).fill(3);

// Delegate contracts
const smartWallet = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const gasManager = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const batchExecutor = Address.from("0x5aAeD5932B9EB3Cd462dDBAeFA21Da757F30FBD");

console.log("Creating Authorization List...\n");

// Create multiple authorizations
const auth1 = Authorization.sign(
	{
		chainId: 1n,
		address: smartWallet,
		nonce: 0n,
	},
	key1,
);

const auth2 = Authorization.sign(
	{
		chainId: 1n,
		address: gasManager,
		nonce: 0n,
	},
	key2,
);

const auth3 = Authorization.sign(
	{
		chainId: 1n,
		address: batchExecutor,
		nonce: 0n,
	},
	key3,
);

const authList = [auth1, auth2, auth3];

// Display authorization list
console.log("Authorization List:");
authList.forEach((auth, i) => {
	const signer = Authorization.verify(auth);
	console.log(`${i + 1}. Signer: ${Address.toHex(signer).slice(0, 10)}...`);
	console.log(`   Delegate: ${Address.toHex(auth.address).slice(0, 10)}...`);
	console.log(`   Nonce: ${auth.nonce}`);
});
console.log();

// Calculate total gas cost
const emptyAccounts = 2; // Assume 2 accounts are empty
const totalGas = Authorization.calculateGasCost(authList, emptyAccounts);

console.log("Gas Cost Breakdown:");
console.log("Authorization Count:", authList.length);
console.log("Empty Accounts:", emptyAccounts);
console.log("Base Cost:", Authorization.PER_AUTH_BASE_COST, "gas each");
console.log(
	"Empty Account Cost:",
	Authorization.PER_EMPTY_ACCOUNT_COST,
	"gas each",
);
console.log();
console.log("Total Gas Required:", totalGas, "gas");
console.log(
	"- Auth base:",
	Authorization.PER_AUTH_BASE_COST * BigInt(authList.length),
	"gas",
);
console.log(
	"- Empty accounts:",
	Authorization.PER_EMPTY_ACCOUNT_COST * BigInt(emptyAccounts),
	"gas",
);
console.log();

// Process all authorizations
const processed = Authorization.processAll(authList);
console.log("Processed Results:", processed.length, "authorizations");
console.log();

// Use case: Coordinated batch operation
console.log("Use Case:");
console.log("Three EOAs temporarily delegate to specialized contracts:");
console.log("1. Smart wallet for advanced signature validation");
console.log("2. Gas manager for sponsored transaction fees");
console.log("3. Batch executor for multiple operations");
console.log();
console.log("All execute atomically in a single transaction.");
