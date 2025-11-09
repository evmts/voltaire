/**
 * Account Management Example - BinaryTree
 *
 * Demonstrates:
 * - Converting Ethereum addresses to tree keys
 * - Packing/unpacking AccountData
 * - Managing account balances and nonces
 * - Storage slot operations
 */

import { BinaryTree } from "../../../src/primitives/BinaryTree/index.js";

console.log("\n=== Ethereum Account Management with BinaryTree ===\n");

// AccountData packing/unpacking utilities
interface AccountData {
	version: number;
	codeSize: number;
	nonce: bigint;
	balance: bigint;
}

function packAccountData(data: AccountData): Uint8Array {
	const packed = new Uint8Array(32);

	// Version (1 byte)
	packed[0] = data.version;

	// Code size (3 bytes, 24-bit big-endian)
	packed[1] = (data.codeSize >> 16) & 0xff;
	packed[2] = (data.codeSize >> 8) & 0xff;
	packed[3] = data.codeSize & 0xff;

	// Nonce (8 bytes, 64-bit big-endian)
	const nonceView = new DataView(packed.buffer, packed.byteOffset, 32);
	nonceView.setBigUint64(4, data.nonce, false);

	// Balance (16 bytes, 128-bit big-endian)
	const balanceHex = data.balance.toString(16).padStart(32, "0");
	for (let i = 0; i < 16; i++) {
		packed[12 + i] = parseInt(balanceHex.slice(i * 2, i * 2 + 2), 16);
	}

	return packed;
}

function unpackAccountData(packed: Uint8Array): AccountData {
	const version = packed[0];
	const codeSize = (packed[1] << 16) | (packed[2] << 8) | packed[3];

	const nonceView = new DataView(packed.buffer, packed.byteOffset, 32);
	const nonce = nonceView.getBigUint64(4, false);

	let balanceHex = "";
	for (let i = 0; i < 16; i++) {
		balanceHex += packed[12 + i].toString(16).padStart(2, "0");
	}
	const balance = BigInt("0x" + balanceHex);

	return { version, codeSize, nonce, balance };
}

// Initialize tree
let tree = BinaryTree();

// Example 1: Create account from address
console.log("1. Creating Account from Ethereum Address");
console.log("   ---------------------------------------");

const aliceAddress = new Uint8Array(20);
aliceAddress[0] = 0xf3;
aliceAddress[1] = 0x9f;
// ... rest of address

const aliceKey = BinaryTree.addressToKey(aliceAddress);
console.log(
	"   Address (first 2 bytes): 0x" +
		aliceAddress[0].toString(16) +
		aliceAddress[1].toString(16),
);
console.log("   Tree key length:", aliceKey.length);
console.log(
	"   Key[12] (first address byte):",
	"0x" + aliceKey[12].toString(16).padStart(2, "0"),
);
console.log(
	"   Key[13] (second address byte):",
	"0x" + aliceKey[13].toString(16).padStart(2, "0"),
);

const { stem, idx } = BinaryTree.splitKey(aliceKey);
console.log("   Stem length:", stem.length);
console.log("   Subindex:", idx);
console.log("");

// Example 2: Store account data
console.log("2. Storing Account Data");
console.log("   --------------------");

const accountDataKey = aliceKey.slice();
accountDataKey[31] = 0; // Subindex 0 for account data

const aliceAccount: AccountData = {
	version: 1,
	codeSize: 0,
	nonce: 0n,
	balance: 1000000000000000000n, // 1 ETH in wei
};

const packedAccount = packAccountData(aliceAccount);
tree = BinaryTree.insert(tree, accountDataKey, packedAccount);

console.log("   Account created:");
console.log("     Version:", aliceAccount.version);
console.log("     Code size:", aliceAccount.codeSize);
console.log("     Nonce:", aliceAccount.nonce.toString());
console.log("     Balance:", aliceAccount.balance.toString(), "wei (1 ETH)");
console.log("   Inserted at subindex:", accountDataKey[31]);
console.log("");

// Example 3: Retrieve and verify account data
console.log("3. Retrieving Account Data");
console.log("   -----------------------");

const retrievedPacked = BinaryTree.get(tree, accountDataKey);
if (retrievedPacked) {
	const retrieved = unpackAccountData(retrievedPacked);
	console.log("   Retrieved account:");
	console.log("     Version:", retrieved.version);
	console.log("     Code size:", retrieved.codeSize);
	console.log("     Nonce:", retrieved.nonce.toString());
	console.log("     Balance:", retrieved.balance.toString(), "wei");
	console.log("   Data matches:", retrieved.balance === aliceAccount.balance);
}
console.log("");

// Example 4: Update account balance
console.log("4. Updating Account Balance");
console.log("   ------------------------");

if (retrievedPacked) {
	const current = unpackAccountData(retrievedPacked);
	console.log("   Current balance:", current.balance.toString(), "wei");

	current.balance += 500000000000000000n; // Add 0.5 ETH
	const updatedPacked = packAccountData(current);
	tree = BinaryTree.insert(tree, accountDataKey, updatedPacked);

	const newPacked = BinaryTree.get(tree, accountDataKey);
	if (newPacked) {
		const newAccount = unpackAccountData(newPacked);
		console.log("   New balance:", newAccount.balance.toString(), "wei");
		console.log(
			"   Balance increased:",
			newAccount.balance > current.balance - 500000000000000000n,
		);
	}
}
console.log("");

// Example 5: Increment nonce
console.log("5. Incrementing Nonce");
console.log("   ------------------");

const currentPacked = BinaryTree.get(tree, accountDataKey);
if (currentPacked) {
	const current = unpackAccountData(currentPacked);
	console.log("   Current nonce:", current.nonce.toString());

	current.nonce += 1n;
	const updatedPacked = packAccountData(current);
	tree = BinaryTree.insert(tree, accountDataKey, updatedPacked);

	const newPacked = BinaryTree.get(tree, accountDataKey);
	if (newPacked) {
		const newAccount = unpackAccountData(newPacked);
		console.log("   New nonce:", newAccount.nonce.toString());
	}
}
console.log("");

// Example 6: Store storage slot
console.log("6. Storing Contract Storage");
console.log("   -------------------------");

const storageKey = aliceKey.slice();
storageKey[31] = 1; // Subindex 1 = storage slot 0

const storageValue = new Uint8Array(32);
storageValue[31] = 0x42;

tree = BinaryTree.insert(tree, storageKey, storageValue);
console.log("   Storage slot 0 at subindex:", storageKey[31]);
console.log("   Storage value[31]:", "0x" + storageValue[31].toString(16));
console.log("");

// Example 7: Multiple storage slots
console.log("7. Multiple Storage Slots");
console.log("   ----------------------");

for (let slot = 0; slot < 5; slot++) {
	const slotKey = aliceKey.slice();
	slotKey[31] = 1 + slot; // Slots 0-4 at subindices 1-5

	const slotValue = new Uint8Array(32);
	slotValue[31] = 0x10 + slot;

	tree = BinaryTree.insert(tree, slotKey, slotValue);
	console.log(
		`   Stored slot ${slot} (subindex ${slotKey[31]}): 0x${slotValue[31].toString(16)}`,
	);
}
console.log("");

// Example 8: Create second account
console.log("8. Creating Second Account (Bob)");
console.log("   ------------------------------");

const bobAddress = new Uint8Array(20);
bobAddress[0] = 0x70;
bobAddress[1] = 0x99;
// ... rest of address

const bobKey = BinaryTree.addressToKey(bobAddress);
const bobAccountKey = bobKey.slice();
bobAccountKey[31] = 0;

const bobAccount: AccountData = {
	version: 1,
	codeSize: 1024, // Has contract code
	nonce: 5n,
	balance: 2000000000000000000n, // 2 ETH
};

const bobPacked = packAccountData(bobAccount);
tree = BinaryTree.insert(tree, bobAccountKey, bobPacked);

console.log("   Bob created:");
console.log(
	"     Address (first 2 bytes): 0x" +
		bobAddress[0].toString(16) +
		bobAddress[1].toString(16),
);
console.log("     Balance:", bobAccount.balance.toString(), "wei (2 ETH)");
console.log("     Nonce:", bobAccount.nonce.toString());
console.log("     Code size:", bobAccount.codeSize, "bytes");
console.log("");

// Example 9: State root with both accounts
console.log("9. Final State Root");
console.log("   ----------------");

const finalRoot = BinaryTree.rootHashHex(tree);
console.log("   Accounts: 2 (Alice, Bob)");
console.log("   Storage slots (Alice): 5");
console.log("   Root type:", tree.root.type);
console.log("   State root:", finalRoot);
console.log("   Root hash commits to all account data and storage");
console.log("");

// Example 10: Verify all data accessible
console.log("10. Verification");
console.log("    -----------");

const aliceVerify = BinaryTree.get(tree, accountDataKey);
const bobVerify = BinaryTree.get(tree, bobAccountKey);
const storage0Verify = BinaryTree.get(tree, aliceKey.slice().fill(1, 31, 32));

console.log("   Alice account accessible:", aliceVerify !== null);
console.log("   Bob account accessible:", bobVerify !== null);
console.log("   Alice storage accessible:", storage0Verify !== null);

if (aliceVerify && bobVerify) {
	const alice = unpackAccountData(aliceVerify);
	const bob = unpackAccountData(bobVerify);
	console.log("   Alice balance:", alice.balance.toString(), "wei");
	console.log("   Bob balance:", bob.balance.toString(), "wei");
	console.log(
		"   Total balance:",
		(alice.balance + bob.balance).toString(),
		"wei",
	);
}
console.log("");

console.log("=== Example Complete ===\n");
