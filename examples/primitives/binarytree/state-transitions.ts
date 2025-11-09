/**
 * State Transitions Example - BinaryTree
 *
 * Demonstrates:
 * - Simulating Ethereum state changes
 * - Transaction-like operations
 * - State snapshots and history
 * - Immutable state transitions
 */

import { BinaryTree } from "../../../src/primitives/BinaryTree/index.js";

console.log("\n=== Ethereum State Transitions with BinaryTree ===\n");

// Helper types
interface AccountState {
	balance: bigint;
	nonce: bigint;
}

// Pack account state (simplified)
function packAccountState(state: AccountState): Uint8Array {
	const packed = new Uint8Array(32);
	const view = new DataView(packed.buffer);

	// Nonce at bytes 0-7
	view.setBigUint64(0, state.nonce, false);

	// Balance at bytes 8-23 (16 bytes)
	const balanceHex = state.balance.toString(16).padStart(32, "0");
	for (let i = 0; i < 16; i++) {
		packed[8 + i] = parseInt(balanceHex.slice(i * 2, i * 2 + 2), 16);
	}

	return packed;
}

function unpackAccountState(packed: Uint8Array): AccountState {
	const view = new DataView(packed.buffer, packed.byteOffset);
	const nonce = view.getBigUint64(0, false);

	let balanceHex = "";
	for (let i = 0; i < 16; i++) {
		balanceHex += packed[8 + i].toString(16).padStart(2, "0");
	}
	const balance = BigInt("0x" + balanceHex);

	return { balance, nonce };
}

// State history tracker
interface StateSnapshot {
	blockNumber: number;
	stateRoot: string;
	description: string;
}

const history: StateSnapshot[] = [];

function captureSnapshot(tree: any, blockNumber: number, description: string) {
	const snapshot = {
		blockNumber,
		stateRoot: BinaryTree.rootHashHex(tree),
		description,
	};
	history.push(snapshot);
	return snapshot;
}

// Example 1: Initial genesis state
console.log("1. Genesis State (Block 0)");
console.log("   -----------------------");

let state = BinaryTree();
captureSnapshot(state, 0, "Genesis - empty state");

console.log("   State root:", BinaryTree.rootHashHex(state));
console.log("   Accounts: 0");
console.log("");

// Example 2: Create initial accounts
console.log("2. Block 1 - Create Accounts");
console.log("   -------------------------");

// Alice
const aliceAddress = new Uint8Array(20);
aliceAddress[0] = 0x01;
const aliceKey = BinaryTree.addressToKey(aliceAddress);
aliceKey[31] = 0; // Account data at subindex 0

const aliceState: AccountState = {
	balance: 1000000000000000000n, // 1 ETH
	nonce: 0n,
};

state = BinaryTree.insert(state, aliceKey, packAccountState(aliceState));

// Bob
const bobAddress = new Uint8Array(20);
bobAddress[0] = 0x02;
const bobKey = BinaryTree.addressToKey(bobAddress);
bobKey[31] = 0;

const bobState: AccountState = {
	balance: 2000000000000000000n, // 2 ETH
	nonce: 0n,
};

state = BinaryTree.insert(state, bobKey, packAccountState(bobState));

const block1 = captureSnapshot(state, 1, "Created Alice and Bob");

console.log("   Alice: 1 ETH, nonce 0");
console.log("   Bob: 2 ETH, nonce 0");
console.log("   State root:", block1.stateRoot);
console.log("");

// Example 3: Transfer transaction
console.log("3. Block 2 - Alice sends 0.5 ETH to Bob");
console.log("   -------------------------------------");

// Get current states
const aliceData = BinaryTree.get(state, aliceKey);
const bobData = BinaryTree.get(state, bobKey);

if (aliceData && bobData) {
	const alice = unpackAccountState(aliceData);
	const bob = unpackAccountState(bobData);

	console.log("   Before:");
	console.log(
		"     Alice: " +
			Number(alice.balance) / 1e18 +
			" ETH, nonce " +
			alice.nonce,
	);
	console.log(
		"     Bob: " + Number(bob.balance) / 1e18 + " ETH, nonce " + bob.nonce,
	);

	// Transfer 0.5 ETH
	const transferAmount = 500000000000000000n;

	alice.balance -= transferAmount;
	alice.nonce += 1n;

	bob.balance += transferAmount;

	// Update state
	state = BinaryTree.insert(state, aliceKey, packAccountState(alice));
	state = BinaryTree.insert(state, bobKey, packAccountState(bob));

	console.log("   After:");
	console.log(
		"     Alice: " +
			Number(alice.balance) / 1e18 +
			" ETH, nonce " +
			alice.nonce,
	);
	console.log(
		"     Bob: " + Number(bob.balance) / 1e18 + " ETH, nonce " + bob.nonce,
	);

	const block2 = captureSnapshot(state, 2, "Alice → Bob: 0.5 ETH");
	console.log("   State root:", block2.stateRoot);
	console.log("   State changed:", block1.stateRoot !== block2.stateRoot);
}
console.log("");

// Example 4: Create contract
console.log("4. Block 3 - Alice Creates Contract");
console.log("   ---------------------------------");

// Contract address (simplified)
const contractAddress = new Uint8Array(20);
contractAddress[0] = 0xff;
const contractKey = BinaryTree.addressToKey(contractAddress);
contractKey[31] = 0;

const contractState: AccountState = {
	balance: 100000000000000000n, // 0.1 ETH from Alice
	nonce: 0n,
};

// Update Alice's balance and nonce
const aliceData2 = BinaryTree.get(state, aliceKey);
if (aliceData2) {
	const alice = unpackAccountState(aliceData2);
	alice.balance -= 100000000000000000n;
	alice.nonce += 1n;

	state = BinaryTree.insert(state, aliceKey, packAccountState(alice));
	state = BinaryTree.insert(
		state,
		contractKey,
		packAccountState(contractState),
	);

	console.log("   Contract created at: 0x" + contractAddress[0].toString(16));
	console.log("   Contract balance: 0.1 ETH");
	console.log("   Alice nonce now:", alice.nonce.toString());

	const block3 = captureSnapshot(state, 3, "Alice created contract");
	console.log("   State root:", block3.stateRoot);
}
console.log("");

// Example 5: Contract storage
console.log("5. Block 4 - Contract Storage Update");
console.log("   ---------------------------------");

const storageKey = BinaryTree.addressToKey(contractAddress);
storageKey[31] = 1; // Storage slot 0 at subindex 1

const storageValue = new Uint8Array(32);
storageValue[31] = 0x42;

state = BinaryTree.insert(state, storageKey, storageValue);

console.log("   Storage slot 0: 0x" + storageValue[31].toString(16));

const block4 = captureSnapshot(state, 4, "Contract storage updated");
console.log("   State root:", block4.stateRoot);
console.log("");

// Example 6: Multiple transactions in block
console.log("6. Block 5 - Multiple Transactions");
console.log("   -------------------------------");

// Bob sends to Alice
const bobData2 = BinaryTree.get(state, bobKey);
const aliceData3 = BinaryTree.get(state, aliceKey);

if (bobData2 && aliceData3) {
	const bob = unpackAccountState(bobData2);
	const alice = unpackAccountState(aliceData3);

	console.log("   Transaction 1: Bob → Alice (0.3 ETH)");
	bob.balance -= 300000000000000000n;
	bob.nonce += 1n;
	alice.balance += 300000000000000000n;

	state = BinaryTree.insert(state, bobKey, packAccountState(bob));
	state = BinaryTree.insert(state, aliceKey, packAccountState(alice));

	console.log("   Transaction 2: Alice → Contract (0.1 ETH)");
	const contractData = BinaryTree.get(state, contractKey);
	if (contractData) {
		const contract = unpackAccountState(contractData);
		alice.balance -= 100000000000000000n;
		alice.nonce += 1n;
		contract.balance += 100000000000000000n;

		state = BinaryTree.insert(state, aliceKey, packAccountState(alice));
		state = BinaryTree.insert(state, contractKey, packAccountState(contract));
	}

	const block5 = captureSnapshot(state, 5, "Multiple transactions");
	console.log("   State root:", block5.stateRoot);
}
console.log("");

// Example 7: State history
console.log("7. State History");
console.log("   -------------");

console.log("   Block history:");
for (const snap of history) {
	console.log(`     Block ${snap.blockNumber}: ${snap.description}`);
	console.log(`       Root: ${snap.stateRoot}`);
}
console.log("");

// Example 8: Verify final balances
console.log("8. Final State Verification");
console.log("   ------------------------");

const finalAlice = BinaryTree.get(state, aliceKey);
const finalBob = BinaryTree.get(state, bobKey);
const finalContract = BinaryTree.get(state, contractKey);

if (finalAlice && finalBob && finalContract) {
	const alice = unpackAccountState(finalAlice);
	const bob = unpackAccountState(finalBob);
	const contract = unpackAccountState(finalContract);

	console.log("   Final balances:");
	console.log(
		"     Alice: " +
			Number(alice.balance) / 1e18 +
			" ETH, nonce " +
			alice.nonce,
	);
	console.log(
		"     Bob: " + Number(bob.balance) / 1e18 + " ETH, nonce " + bob.nonce,
	);
	console.log(
		"     Contract: " +
			Number(contract.balance) / 1e18 +
			" ETH, nonce " +
			contract.nonce,
	);

	const totalBalance = alice.balance + bob.balance + contract.balance;
	console.log("   Total: " + Number(totalBalance) / 1e18 + " ETH");
	console.log(
		"   Conservation: " +
			(totalBalance === 3000000000000000000n ? "OK" : "FAIL"),
	);
}
console.log("");

// Example 9: State root as commitment
console.log("9. State Root as Commitment");
console.log("   ------------------------");

const currentRoot = BinaryTree.rootHashHex(state);
console.log("   Current state root:", currentRoot);
console.log("   This hash commits to:");
console.log("     - All account balances");
console.log("     - All account nonces");
console.log("     - All storage slots");
console.log("     - Entire tree structure");
console.log("");
console.log("   Verification: Rebuild state → compare roots");
console.log("   State changes: Any modification → different root");
console.log("");

// Example 10: Immutability demonstration
console.log("10. Immutability Demonstration");
console.log("    --------------------------");

console.log("   Historical states remain unchanged:");
console.log("     Block 0 root:", history[0].stateRoot);
console.log("     Block 1 root:", history[1].stateRoot);
console.log("     Block 5 root:", history[5].stateRoot);
console.log("");
console.log("   Each block produces new immutable state");
console.log("   Previous states preserved for verification");
console.log("");

console.log("=== Example Complete ===\n");
