/**
 * Storage Trie
 *
 * Demonstrates building a contract storage trie, similar to how Ethereum
 * stores contract state variables in a separate trie per contract.
 *
 * NOTE: This example shows the intended TypeScript API. Trie is currently implemented
 * in Zig only and not yet exposed to TypeScript through FFI bindings.
 */

import type { AddressType } from "../../../src/primitives/Address/AddressType.js";
import { Address } from "../../../src/primitives/Address/index.js";
import * as Bytes from "../../../src/primitives/Bytes/Bytes.index.js";
import type { Bytes32Type } from "../../../src/primitives/Bytes/Bytes32/Bytes32Type.js";
import * as Bytes32 from "../../../src/primitives/Bytes/Bytes32/index.js";
import type { HashType } from "../../../src/primitives/Hash/HashType.js";
import { Hash } from "../../../src/primitives/Hash/index.js";

// Conceptual Trie implementation for demonstration
class Trie {
	private data = new Map<string, Uint8Array>();

	put(key: Bytes32Type, value: Uint8Array): void {
		const hex = Bytes32.toHex(key);
		this.data.set(hex, value);
	}

	get(key: Bytes32Type): Uint8Array | null {
		const hex = Bytes32.toHex(key);
		return this.data.get(hex) || null;
	}

	rootHash(): HashType | null {
		if (this.data.size === 0) return null;
		return Hash.random();
	}
}

/** Compute storage key for a mapping (slot, key) -> Keccak256(key || slot) */
function computeStorageKey(slot: bigint, key: Uint8Array): Bytes32Type {
	// In production, this would use Keccak256
	// For demo, simplified hash simulation
	const slotBytes = Bytes32.fromBigint(slot);

	// Concatenate key + slot
	const combined = Bytes.concat(
		Bytes.from(key),
		Bytes.from(slotBytes as Uint8Array),
	);

	// Mock hash (production would use Keccak256)
	const hash = Bytes32.zero();
	for (let i = 0; i < 32; i++) {
		hash[i] = combined[i % combined.length] ^ (i * 7);
	}
	return hash;
}

function bigintToBytes32(value: bigint): Bytes32Type {
	return Bytes32.fromBigint(value);
}

// Create storage trie for a contract
const storageTrie = new Trie();

// Storage slot 0: owner address
const slot0 = Bytes32.zero();
const ownerAddr = Address(0x1234n);
// Pad address to 32 bytes for storage
const ownerAddrPadded = Bytes.padLeft(Bytes.from(ownerAddr as Uint8Array), 32);
storageTrie.put(slot0, ownerAddrPadded);

// Storage slot 1: total supply
const slot1 = Bytes32.fromNumber(1);
const totalSupply = 1_000_000_000_000_000_000_000_000n; // 1M tokens (18 decimals)
const supplyBytes = bigintToBytes32(totalSupply);
storageTrie.put(slot1, supplyBytes);

// Storage slot 2: balances mapping
// balances[owner_addr] = 500k tokens
const balanceSlot = computeStorageKey(2n, ownerAddr);
const ownerBalance = 500_000_000_000_000_000_000_000n;
const balanceBytes = bigintToBytes32(ownerBalance);
storageTrie.put(balanceSlot, balanceBytes);

// Another balance: different address
const addr2 = Address(0xabcdn);
const balanceSlot2 = computeStorageKey(2n, addr2);
const balance2 = 300_000_000_000_000_000_000_000n;
const balance2Bytes = bigintToBytes32(balance2);
storageTrie.put(balanceSlot2, balance2Bytes);

// Storage slot 3: allowances mapping (nested mapping)
// allowances[owner_addr][spender_addr] = 100k tokens
const spenderAddr = Address(0x5678n);

// First compute inner mapping key
const innerKey = computeStorageKey(3n, ownerAddr);
// Then compute outer mapping key
const innerKeyBigInt = Bytes32.toBigint(innerKey);
const allowanceSlot = computeStorageKey(innerKeyBigInt, spenderAddr);
const allowance = 100_000_000_000_000_000_000_000n;
const allowanceBytes = bigintToBytes32(allowance);
storageTrie.put(allowanceSlot, allowanceBytes);

// Compute storage root
const storageRoot = storageTrie.rootHash();
const retrievedOwner = storageTrie.get(slot0);

const retrievedSupply = storageTrie.get(slot1);
if (retrievedSupply) {
	// Convert bytes back to bigint
	const supplyVal = Bytes32.toBigint(retrievedSupply as Bytes32Type);
}

/**
 * Storage Layout:
 *
 * Solidity contract:
 * ```solidity
 * contract ERC20 {
 *     address public owner;              // Slot 0
 *     uint256 public totalSupply;        // Slot 1
 *     mapping(address => uint256) public balances;    // Slot 2
 *     mapping(address => mapping(address => uint256)) public allowances; // Slot 3
 * }
 * ```
 *
 * Storage keys:
 * - Simple slots: Direct slot number
 * - Mappings: keccak256(key || slot)
 * - Nested mappings: keccak256(innerKey || keccak256(outerKey || slot))
 */
