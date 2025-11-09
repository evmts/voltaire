/**
 * Storage Trie
 *
 * Demonstrates building a contract storage trie, similar to how Ethereum
 * stores contract state variables in a separate trie per contract.
 *
 * NOTE: This example shows the intended TypeScript API. Trie is currently implemented
 * in Zig only and not yet exposed to TypeScript through FFI bindings.
 */

// Conceptual Trie implementation for demonstration
class Trie {
	private data = new Map<string, Uint8Array>();

	put(key: Uint8Array, value: Uint8Array): void {
		this.data.set(Buffer.from(key).toString("hex"), value);
	}

	get(key: Uint8Array): Uint8Array | null {
		return this.data.get(Buffer.from(key).toString("hex")) || null;
	}

	rootHash(): Uint8Array | null {
		if (this.data.size === 0) return null;
		const hash = new Uint8Array(32);
		crypto.getRandomValues(hash);
		return hash;
	}
}

/** Compute storage key for a mapping (slot, key) -> Keccak256(key || slot) */
function computeStorageKey(slot: bigint, key: Uint8Array): Uint8Array {
	// In production, this would use Keccak256
	// For demo, simplified hash simulation
	const slotBytes = new Uint8Array(32);
	new DataView(slotBytes.buffer).setBigUint64(24, slot, false);

	// Concatenate key + slot
	const combined = new Uint8Array(key.length + 32);
	combined.set(key, 0);
	combined.set(slotBytes, key.length);

	// Mock hash (production would use Keccak256)
	const hash = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		hash[i] = combined[i % combined.length] ^ (i * 7);
	}
	return hash;
}

function formatAddress(addr: Uint8Array): string {
	return `0x${Array.from(addr)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

function formatHash(hash: Uint8Array): string {
	return `0x${Array.from(hash)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

function bigintToBytes(value: bigint): Uint8Array {
	const bytes = new Uint8Array(32);
	const view = new DataView(bytes.buffer);

	// Write as big-endian
	for (let i = 0; i < 4; i++) {
		const offset = 24 - i * 8;
		const part = Number((value >> BigInt(i * 64)) & 0xffffffffffffffffn);
		view.setBigUint64(offset, BigInt(part), false);
	}

	return bytes;
}

// Create storage trie for a contract
const storageTrie = new Trie();

// Storage slot 0: owner address
const slot0 = new Uint8Array(32);
const ownerAddr = new Uint8Array([0x12, 0x34, ...new Array(18).fill(0)]);
storageTrie.put(slot0, ownerAddr);

// Storage slot 1: total supply
const slot1 = new Uint8Array(32);
slot1[31] = 1;
const totalSupply = 1_000_000_000_000_000_000_000_000n; // 1M tokens (18 decimals)
const supplyBytes = bigintToBytes(totalSupply);
storageTrie.put(slot1, supplyBytes);

// Storage slot 2: balances mapping
// balances[owner_addr] = 500k tokens
const balanceSlot = computeStorageKey(2n, ownerAddr);
const ownerBalance = 500_000_000_000_000_000_000_000n;
const balanceBytes = bigintToBytes(ownerBalance);
storageTrie.put(balanceSlot, balanceBytes);

// Another balance: different address
const addr2 = new Uint8Array([0xab, 0xcd, ...new Array(18).fill(0)]);
const balanceSlot2 = computeStorageKey(2n, addr2);
const balance2 = 300_000_000_000_000_000_000_000n;
const balance2Bytes = bigintToBytes(balance2);
storageTrie.put(balanceSlot2, balance2Bytes);

// Storage slot 3: allowances mapping (nested mapping)
// allowances[owner_addr][spender_addr] = 100k tokens
const spenderAddr = new Uint8Array([0x56, 0x78, ...new Array(18).fill(0)]);

// First compute inner mapping key
const innerKey = computeStorageKey(3n, ownerAddr);
// Then compute outer mapping key
const innerKeyBigInt = Array.from(innerKey).reduce(
	(acc, byte, i) => acc | (BigInt(byte) << BigInt((31 - i) * 8)),
	0n,
);
const allowanceSlot = computeStorageKey(innerKeyBigInt, spenderAddr);
const allowance = 100_000_000_000_000_000_000_000n;
const allowanceBytes = bigintToBytes(allowance);
storageTrie.put(allowanceSlot, allowanceBytes);

// Compute storage root
const storageRoot = storageTrie.rootHash();
const retrievedOwner = storageTrie.get(slot0);

const retrievedSupply = storageTrie.get(slot1);
if (retrievedSupply) {
	// Convert bytes back to bigint
	const view = new DataView(retrievedSupply.buffer);
	let supplyVal = 0n;
	for (let i = 0; i < 4; i++) {
		const offset = 24 - i * 8;
		const part = view.getBigUint64(offset, false);
		supplyVal |= part << BigInt(i * 64);
	}
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
