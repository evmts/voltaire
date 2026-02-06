import { Address } from "@tevm/voltaire";

// StorageKey: Contract storage slot keys
// Used for eth_getStorageAt and storage proofs

// Storage slots are 32-byte keys that map to storage values
// Slot 0 is typically the first declared state variable

// Simple slot (first variable)
const slot0 = 0n;
console.log("Slot 0:", "0x" + slot0.toString(16).padStart(64, "0"));

// Calculate mapping slot: keccak256(key . slot)
// For mapping(address => uint256) at slot 1
const mappingSlot = 1n;
const userAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// The key for mappingSlot[userAddress] would be:
// keccak256(abi.encodePacked(userAddress, uint256(mappingSlot)))
console.log("Mapping base slot:", mappingSlot);
console.log("User address:", userAddress);

// Calculate nested mapping slot: keccak256(key2 . keccak256(key1 . slot))
// For mapping(address => mapping(address => uint256)) allowances at slot 2
const allowanceSlot = 2n;
const owner = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const spender = Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");

console.log("\nAllowance slot calculation:");
console.log("  Base slot:", allowanceSlot);
console.log("  Owner:", owner);
console.log("  Spender:", spender);

// Array slots: slot + index
// For uint256[] at slot 3, element at index 5
const arraySlot = 3n;
const arrayIndex = 5n;
// Array length is at slot 3
// Element i is at keccak256(slot) + i
console.log("\nArray storage:");
console.log("  Array length slot:", arraySlot);
console.log("  Element index:", arrayIndex);

// Struct slots are consecutive
// For struct at slot 4 with 3 fields
const structSlot = 4n;
console.log("\nStruct storage:");
console.log("  Field 0:", structSlot);
console.log("  Field 1:", structSlot + 1n);
console.log("  Field 2:", structSlot + 2n);

// ERC20 standard slots (varies by implementation)
const erc20Slots = {
	totalSupply: 0n,
	balances: 1n,      // mapping(address => uint256)
	allowances: 2n,    // mapping(address => mapping(address => uint256))
	name: 3n,
	symbol: 4n,
	decimals: 5n,
};

console.log("\nCommon ERC20 slots:", erc20Slots);
