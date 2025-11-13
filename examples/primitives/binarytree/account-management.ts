/**
 * Account Management Example - BinaryTree
 *
 * Demonstrates:
 * - Converting Ethereum addresses to tree keys
 * - Packing/unpacking AccountData
 * - Managing account balances and nonces
 * - Storage slot operations
 */

import { Address } from "../../../src/primitives/Address/index.js";
import { BinaryTree } from "../../../src/primitives/BinaryTree/index.js";
import { Bytes32 } from "../../../src/primitives/Bytes32/index.js";

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
		packed[12 + i] = Number.parseInt(balanceHex.slice(i * 2, i * 2 + 2), 16);
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
	const balance = BigInt(`0x${balanceHex}`);

	return { version, codeSize, nonce, balance };
}

// Initialize tree
let tree = BinaryTree();

const aliceAddress = Address.from("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // Known test address

const aliceKey = BinaryTree.addressToKey(aliceAddress);

const { stem, idx } = BinaryTree.splitKey(aliceKey);

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

const retrievedPacked = BinaryTree.get(tree, accountDataKey);
if (retrievedPacked) {
	const retrieved = unpackAccountData(retrievedPacked);
}

if (retrievedPacked) {
	const current = unpackAccountData(retrievedPacked);

	current.balance += 500000000000000000n; // Add 0.5 ETH
	const updatedPacked = packAccountData(current);
	tree = BinaryTree.insert(tree, accountDataKey, updatedPacked);

	const newPacked = BinaryTree.get(tree, accountDataKey);
	if (newPacked) {
		const newAccount = unpackAccountData(newPacked);
	}
}

const currentPacked = BinaryTree.get(tree, accountDataKey);
if (currentPacked) {
	const current = unpackAccountData(currentPacked);

	current.nonce += 1n;
	const updatedPacked = packAccountData(current);
	tree = BinaryTree.insert(tree, accountDataKey, updatedPacked);

	const newPacked = BinaryTree.get(tree, accountDataKey);
	if (newPacked) {
		const newAccount = unpackAccountData(newPacked);
	}
}

const storageKey = aliceKey.slice();
storageKey[31] = 1; // Subindex 1 = storage slot 0

const storageValue = Bytes32.from(
	"0x0000000000000000000000000000000000000000000000000000000000000042",
);

tree = BinaryTree.insert(tree, storageKey, storageValue);

for (let slot = 0; slot < 5; slot++) {
	const slotKey = aliceKey.slice();
	slotKey[31] = 1 + slot; // Slots 0-4 at subindices 1-5

	const slotValue = Bytes32.from(
		`0x${(0x10 + slot).toString(16).padStart(64, "0")}`,
	);

	tree = BinaryTree.insert(tree, slotKey, slotValue);
}

const bobAddress = Address.from("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"); // Known test address

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

const finalRoot = BinaryTree.rootHashHex(tree);

const aliceVerify = BinaryTree.get(tree, accountDataKey);
const bobVerify = BinaryTree.get(tree, bobAccountKey);
const storage0Verify = BinaryTree.get(tree, aliceKey.slice().fill(1, 31, 32));

if (aliceVerify && bobVerify) {
	const alice = unpackAccountData(aliceVerify);
	const bob = unpackAccountData(bobVerify);
}
