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
		packed[8 + i] = Number.parseInt(balanceHex.slice(i * 2, i * 2 + 2), 16);
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
	const balance = BigInt(`0x${balanceHex}`);

	return { balance, nonce };
}

// State history tracker
interface StateSnapshot {
	blockNumber: number;
	stateRoot: string;
	description: string;
}

const history: StateSnapshot[] = [];

function captureSnapshot(
	tree: ReturnType<typeof BinaryTree>,
	blockNumber: number,
	description: string,
) {
	const snapshot = {
		blockNumber,
		stateRoot: BinaryTree.rootHashHex(tree),
		description,
	};
	history.push(snapshot);
	return snapshot;
}

let state = BinaryTree();
captureSnapshot(state, 0, "Genesis - empty state");

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

// Get current states
const aliceData = BinaryTree.get(state, aliceKey);
const bobData = BinaryTree.get(state, bobKey);

if (aliceData && bobData) {
	const alice = unpackAccountState(aliceData);
	const bob = unpackAccountState(bobData);

	// Transfer 0.5 ETH
	const transferAmount = 500000000000000000n;

	alice.balance -= transferAmount;
	alice.nonce += 1n;

	bob.balance += transferAmount;

	// Update state
	state = BinaryTree.insert(state, aliceKey, packAccountState(alice));
	state = BinaryTree.insert(state, bobKey, packAccountState(bob));

	const block2 = captureSnapshot(state, 2, "Alice → Bob: 0.5 ETH");
}

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

	const block3 = captureSnapshot(state, 3, "Alice created contract");
}

const storageKey = BinaryTree.addressToKey(contractAddress);
storageKey[31] = 1; // Storage slot 0 at subindex 1

const storageValue = new Uint8Array(32);
storageValue[31] = 0x42;

state = BinaryTree.insert(state, storageKey, storageValue);

const block4 = captureSnapshot(state, 4, "Contract storage updated");

// Bob sends to Alice
const bobData2 = BinaryTree.get(state, bobKey);
const aliceData3 = BinaryTree.get(state, aliceKey);

if (bobData2 && aliceData3) {
	const bob = unpackAccountState(bobData2);
	const alice = unpackAccountState(aliceData3);
	bob.balance -= 300000000000000000n;
	bob.nonce += 1n;
	alice.balance += 300000000000000000n;

	state = BinaryTree.insert(state, bobKey, packAccountState(bob));
	state = BinaryTree.insert(state, aliceKey, packAccountState(alice));
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
}
for (const snap of history) {
}

const finalAlice = BinaryTree.get(state, aliceKey);
const finalBob = BinaryTree.get(state, bobKey);
const finalContract = BinaryTree.get(state, contractKey);

if (finalAlice && finalBob && finalContract) {
	const alice = unpackAccountState(finalAlice);
	const bob = unpackAccountState(finalBob);
	const contract = unpackAccountState(finalContract);

	const totalBalance = alice.balance + bob.balance + contract.balance;
}

const currentRoot = BinaryTree.rootHashHex(state);
