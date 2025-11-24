import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Gas Cost Calculation
// Understanding authorization gas costs

console.log("=== Authorization Gas Costs ===\n");

// Constants
console.log("Gas Cost Constants:");
console.log("MAGIC_BYTE:", Authorization.MAGIC_BYTE.toString(16));
console.log("PER_AUTH_BASE_COST:", Authorization.PER_AUTH_BASE_COST, "gas");
console.log(
	"PER_EMPTY_ACCOUNT_COST:",
	Authorization.PER_EMPTY_ACCOUNT_COST,
	"gas",
);
console.log();

const delegate = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const privateKey = new Uint8Array(32).fill(1);

// Single authorization costs
console.log("Single Authorization Costs:\n");

const auth = Authorization.sign(
	{
		chainId: 1n,
		address: delegate,
		nonce: 0n,
	},
	privateKey,
);

const costExisting = Authorization.getGasCost(auth, false);
const costEmpty = Authorization.getGasCost(auth, true);

console.log("Existing account:", costExisting, "gas");
console.log("- Base cost:", Authorization.PER_AUTH_BASE_COST, "gas");
console.log();

console.log("Empty account:", costEmpty, "gas");
console.log("- Base cost:", Authorization.PER_AUTH_BASE_COST, "gas");
console.log("- Empty cost:", Authorization.PER_EMPTY_ACCOUNT_COST, "gas");
console.log();

// Multiple authorization scenarios
console.log("Multiple Authorization Scenarios:\n");

const scenarios = [
	{ count: 1, empty: 0 },
	{ count: 1, empty: 1 },
	{ count: 3, empty: 0 },
	{ count: 3, empty: 1 },
	{ count: 3, empty: 3 },
	{ count: 10, empty: 5 },
];

scenarios.forEach(({ count, empty }) => {
	const authList = Array.from({ length: count }, (_, i) =>
		Authorization.sign(
			{
				chainId: 1n,
				address: delegate,
				nonce: BigInt(i),
			},
			privateKey,
		),
	);

	const total = Authorization.calculateGasCost(authList, empty);
	const base = Authorization.PER_AUTH_BASE_COST * BigInt(count);
	const emptyGas = Authorization.PER_EMPTY_ACCOUNT_COST * BigInt(empty);

	console.log(`${count} auth(s), ${empty} empty account(s):`);
	console.log(`  Base: ${base} gas`);
	console.log(`  Empty: ${emptyGas} gas`);
	console.log(`  Total: ${total} gas`);
	console.log();
});

// Cost comparison
console.log("Cost Analysis:\n");

const costs = {
	single: Authorization.PER_AUTH_BASE_COST,
	singleEmpty:
		Authorization.PER_AUTH_BASE_COST + Authorization.PER_EMPTY_ACCOUNT_COST,
	batch10: Authorization.PER_AUTH_BASE_COST * 10n,
	batch10Empty:
		Authorization.PER_AUTH_BASE_COST * 10n +
		Authorization.PER_EMPTY_ACCOUNT_COST * 10n,
};

console.log("Single authorization (existing):", costs.single);
console.log("Single authorization (empty):", costs.singleEmpty);
console.log("Difference:", costs.singleEmpty - costs.single);
console.log();

console.log("Batch 10 authorizations (existing):", costs.batch10);
console.log("Batch 10 authorizations (empty):", costs.batch10Empty);
console.log("Difference:", costs.batch10Empty - costs.batch10);
console.log();

console.log("Gas per authorization:", Authorization.PER_AUTH_BASE_COST);
console.log(
	"Additional gas per empty account:",
	Authorization.PER_EMPTY_ACCOUNT_COST,
);
console.log();

// Empty list
const emptyCost = Authorization.calculateGasCost([], 0);
console.log("Empty authorization list:", emptyCost, "gas");
