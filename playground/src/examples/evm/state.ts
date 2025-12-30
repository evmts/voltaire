import { Address, Hex, Keccak256, StorageKey } from "@tevm/voltaire";

// State and storage key management
console.log("Storage Key Management");

// Create a storage key from address and slot (DAI contract example)
const contractAddr = Address("0x6B175474E89094C44Da98b954EedeaC495271d0F");
const slot = 0n;
const storageKey = StorageKey.create(contractAddr, slot);
console.log("\nDAI contract storage key (slot 0):");
console.log("  Contract:", Address.toHex(contractAddr));
console.log("  Key:", StorageKey.toString(storageKey));

// Storage slot calculation for mappings
// For mapping(address => uint256), slot = keccak256(key . slot)
const userAddr = Address("0x1234567890123456789012345678901234567890");
const mappingSlot = 1n; // Base slot of the mapping

// Encode: abi.encode(address, uint256)
const encoded = new Uint8Array(64);
encoded.set(Hex.toBytes(Address.toHex(userAddr)).slice(-20), 12); // address padded to 32 bytes
const slotBytes = new Uint8Array(32);
new DataView(slotBytes.buffer).setBigUint64(24, mappingSlot, false);
encoded.set(slotBytes, 32);

const derivedSlot = Keccak256.hash(encoded);
console.log("\nMapping slot calculation:");
console.log("  User address:", Address.toHex(userAddr));
console.log("  Base slot:", mappingSlot.toString());
console.log("  Derived slot:", Hex.fromBytes(derivedSlot));

// Storage slot for nested mappings
// mapping(address => mapping(address => uint256))
const spender = Address("0xabcdef0123456789abcdef0123456789abcdef01");
const innerSlot = Keccak256.hash(encoded); // First level

// Second level: keccak256(spender . innerSlot)
const encoded2 = new Uint8Array(64);
encoded2.set(Hex.toBytes(Address.toHex(spender)).slice(-20), 12);
encoded2.set(innerSlot, 32);
const finalSlot = Keccak256.hash(encoded2);
console.log("\nNested mapping (allowance) slot:");
console.log("  Owner:", Address.toHex(userAddr));
console.log("  Spender:", Address.toHex(spender));
console.log("  Final slot:", Hex.fromBytes(finalSlot));

// Check storage key equality
const key1 = StorageKey.create(contractAddr, 0n);
const key2 = StorageKey.create(contractAddr, 0n);
const key3 = StorageKey.create(contractAddr, 1n);
console.log("\nStorage key equality:");
console.log("  key1 === key2 (same slot):", StorageKey.equals(key1, key2));
console.log("  key1 === key3 (different slot):", StorageKey.equals(key1, key3));

// Array storage slot calculation
// Array elements: keccak256(slot) + index
const arraySlot = 2n;
const arraySlotBytes = new Uint8Array(32);
new DataView(arraySlotBytes.buffer).setBigUint64(24, arraySlot, false);
const arrayBase = Keccak256.hash(arraySlotBytes);
console.log("\nArray storage (slot 2):");
console.log("  Array base:", Hex.fromBytes(arrayBase));
