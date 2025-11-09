/**
 * EIP-7702 Authorization Transaction Example
 *
 * Demonstrates EOA delegation allowing externally-owned accounts
 * to temporarily execute as smart contracts:
 * - Creating authorization signatures
 * - Batched operations
 * - Social recovery patterns
 * - Gas abstraction
 */

import * as Transaction from "../../../src/primitives/Transaction/index.js";
import * as Address from "../../../src/primitives/Address/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

console.log("=== EIP-7702 Authorization Transaction Examples ===\n");

// Example 1: Basic EIP-7702 transaction with single authorization
console.log("1. Basic EIP-7702 Transaction");
console.log("-".repeat(50));

const authorization: Transaction.Authorization = {
	chainId: 1n,
	address: Address.from("0x1111111111111111111111111111111111111111"), // Smart wallet contract
	nonce: 0n, // EOA nonce when signing authorization
	yParity: 0,
	r: Hex.toBytes(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	s: Hex.toBytes(
		"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	),
};

const eip7702Tx: Transaction.EIP7702 = {
	type: Transaction.Type.EIP7702,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 0n,
	data: Hex.toBytes("0xa9059cbb" + "00".repeat(64)), // Contract call data
	accessList: [],
	authorizationList: [authorization],
	yParity: 0,
	r: Hex.toBytes("0x" + "00".repeat(32)),
	s: Hex.toBytes("0x" + "00".repeat(32)),
};

console.log("Transaction:");
console.log("  Type:", eip7702Tx.type, "(EIP-7702)");
console.log("  Chain ID:", eip7702Tx.chainId);
console.log(
	"  Authorization Count:",
	Transaction.getAuthorizationCount(eip7702Tx),
);
console.log();

console.log("Authorization:");
console.log("  Delegated to:", Address.toHex(authorization.address));
console.log("  Chain ID:", authorization.chainId);
console.log("  Nonce:", authorization.nonce, "(EOA nonce at signing time)");
console.log();

console.log("Lifecycle:");
console.log("  Before TX: EOA.code = empty");
console.log(
	"  During TX: EOA.code = DELEGATECALL(" +
		Address.toHex(authorization.address) +
		")",
);
console.log("  After TX: EOA.code = empty (reverted)");
console.log();

// Example 2: Batched transaction execution
console.log("2. Batched Transaction Pattern");
console.log("-".repeat(50));

const batchWalletAddress = Address.from(
	"0x2222222222222222222222222222222222222222",
);

const batchAuth: Transaction.Authorization = {
	chainId: 1n,
	address: batchWalletAddress, // Contract with executeBatch() function
	nonce: 0n,
	yParity: 0,
	r: Hex.toBytes("0x" + "00".repeat(32)),
	s: Hex.toBytes("0x" + "00".repeat(32)),
};

console.log("Batched Operations:");
console.log("  Delegate to:", Address.toHex(batchWalletAddress));
console.log("  Contract function: executeBatch(Call[])");
console.log();

console.log("Example batch calls:");
console.log("  1. Transfer token A");
console.log("  2. Transfer token B");
console.log("  3. Swap on DEX");
console.log("  All in one transaction!");
console.log();

// Example 3: Multiple authorizations
console.log("3. Multiple Authorizations (Advanced)");
console.log("-".repeat(50));

const multiAuthTx: Transaction.EIP7702 = {
	type: Transaction.Type.EIP7702,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 200_000n,
	to: null,
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	authorizationList: [
		{
			chainId: 1n,
			address: Address.from("0x1111111111111111111111111111111111111111"),
			nonce: 5n,
			yParity: 0,
			r: Hex.toBytes("0x" + "00".repeat(32)),
			s: Hex.toBytes("0x" + "00".repeat(32)),
		},
		{
			chainId: 1n,
			address: Address.from("0x2222222222222222222222222222222222222222"),
			nonce: 10n,
			yParity: 1,
			r: Hex.toBytes("0x" + "00".repeat(32)),
			s: Hex.toBytes("0x" + "00".repeat(32)),
		},
	],
	yParity: 0,
	r: Hex.toBytes("0x" + "00".repeat(32)),
	s: Hex.toBytes("0x" + "00".repeat(32)),
};

console.log("Multiple Authorizations:");
console.log("  Count:", Transaction.getAuthorizationCount(multiAuthTx));
for (let i = 0; i < multiAuthTx.authorizationList.length; i++) {
	const auth = multiAuthTx.authorizationList[i];
	console.log(`  Auth ${i + 1}:`);
	console.log(`    Address: ${Address.toHex(auth.address)}`);
	console.log(`    Nonce: ${auth.nonce}`);
}
console.log();

// Example 4: Social recovery pattern
console.log("4. Social Recovery Pattern");
console.log("-".repeat(50));

console.log("Use Case: Guardian-assisted account recovery");
console.log();

const recoveryContractAddr = Address.from(
	"0x3333333333333333333333333333333333333333",
);
console.log("Recovery Contract:", Address.toHex(recoveryContractAddr));
console.log("  Function: initiateRecovery(newOwner)");
console.log("  Guardians: 3 of 5 multisig");
console.log();

console.log("Recovery Flow:");
console.log("  1. User loses access to private key");
console.log("  2. Guardians sign authorization for recovery contract");
console.log("  3. EIP-7702 TX delegates EOA to recovery contract");
console.log("  4. Recovery contract verifies guardian signatures");
console.log("  5. Recovery contract updates EOA ownership");
console.log("  6. EOA reverts to normal (with new owner)");
console.log();

// Example 5: Gas abstraction (gasless transactions)
console.log("5. Gas Abstraction Pattern");
console.log("-".repeat(50));

console.log("Use Case: User pays in tokens, relayer pays gas");
console.log();

const gaslessContractAddr = Address.from(
	"0x4444444444444444444444444444444444444444",
);
console.log("Gasless Contract:", Address.toHex(gaslessContractAddr));
console.log("  Function: executeWithTokenPayment(call, token, amount)");
console.log();

console.log("Flow:");
console.log("  1. User signs authorization for gasless contract");
console.log("  2. User signs transaction (0 gas price for user)");
console.log("  3. Relayer submits EIP-7702 TX (pays gas)");
console.log("  4. Gasless contract executes user call");
console.log("  5. Gasless contract transfers tokens to relayer");
console.log("  6. User paid in tokens, relayer paid in ETH");
console.log();

// Example 6: Security considerations
console.log("6. Security Considerations");
console.log("-".repeat(50));

console.log("Nonce Protection:");
console.log("  Authorization includes EOA nonce");
console.log("  If nonce mismatch → authorization rejected");
console.log("  Prevents replay across transactions");
console.log();

console.log("Chain ID Binding:");
console.log("  Authorization includes chain ID");
console.log("  Cannot replay on different chains");
console.log();

console.log("Temporary Delegation:");
console.log("  Delegation ONLY during transaction");
console.log("  EOA automatically reverts after TX");
console.log("  No permanent state change");
console.log();

console.log("Contract Trust:");
console.log("  ⚠️  Delegated contract has full control during TX");
console.log("  ⚠️  Can drain funds, modify state, etc.");
console.log("  ✓  Only delegate to audited contracts");
console.log();

// Example 7: Spending limits pattern
console.log("7. Spending Limits Pattern");
console.log("-".repeat(50));

const spendingLimitAddr = Address.from(
	"0x5555555555555555555555555555555555555555",
);

console.log("Spending Limit Contract:", Address.toHex(spendingLimitAddr));
console.log("  Daily limit: 1 ETH");
console.log("  Per-transaction limit: 0.1 ETH");
console.log();

console.log("Benefits:");
console.log("  ✓ Prevent large unauthorized transfers");
console.log("  ✓ Rate limiting for security");
console.log("  ✓ Configurable limits");
console.log("  ✓ Still use EOA wallet");
console.log();

// Example 8: EIP-7702 vs Account Abstraction
console.log("8. EIP-7702 vs Account Abstraction Comparison");
console.log("-".repeat(50));

console.log("EIP-7702:");
console.log("  Account Type: EOA (temporary delegation)");
console.log("  Deployment: None required");
console.log("  Duration: Per transaction only");
console.log("  Compatibility: Full EOA compatibility");
console.log("  Cost: Lower (no deployment)");
console.log();

console.log("ERC-4337 (Account Abstraction):");
console.log("  Account Type: Smart contract");
console.log("  Deployment: Required");
console.log("  Duration: Permanent");
console.log("  Compatibility: New account type");
console.log("  Cost: Higher (deployment gas)");
console.log();

console.log("Use EIP-7702 when:");
console.log("  ✓ Want temporary smart contract features");
console.log("  ✓ Keep existing EOA");
console.log("  ✓ Lower setup cost");
console.log("  ✓ Backwards compatibility important");
