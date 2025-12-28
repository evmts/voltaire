import { Bytes, Bytes1, Bytes4, Bytes8, Bytes16, Bytes32, Bytes64, Hex } from "@tevm/voltaire";

// === Generic Bytes ===
// Create from array
const bytes = Bytes([0x01, 0x02, 0x03, 0x04, 0x05]);
console.log("Bytes:", Hex.fromBytes(bytes));

// Create zero bytes
const zeros = Bytes.zero(16);
console.log("16 zero bytes:", Hex.fromBytes(zeros));

// Random bytes
const random = Bytes.random(32);
console.log("32 random bytes:", Hex.fromBytes(random));

// === Bytes1 (1 byte) ===
// Opcodes, flags, single values
const opcode = Bytes1.from([0x60]);  // PUSH1
console.log("Bytes1 (opcode):", Hex.fromBytes(opcode));

// === Bytes4 (4 bytes) ===
// Function selectors
const transferSelector = Bytes4.from([0xa9, 0x05, 0x9c, 0xbb]);
console.log("Bytes4 (selector):", Hex.fromBytes(transferSelector));

// From hex
const approveSelector = Bytes4.fromHex("0x095ea7b3");
console.log("Bytes4 (approve):", Hex.fromBytes(approveSelector));

// === Bytes8 (8 bytes) ===
// Timestamps, chain IDs
const timestamp = Bytes8.from([0x00, 0x00, 0x00, 0x00, 0x65, 0x9a, 0x12, 0x34]);
console.log("Bytes8 (timestamp):", Hex.fromBytes(timestamp));

// === Bytes16 (16 bytes) ===
// UUIDs, compact identifiers
const uuid = Bytes16.random();
console.log("Bytes16 (uuid):", Hex.fromBytes(uuid));

// === Bytes32 (32 bytes) ===
// Hashes, storage keys, private keys
const storageKey = Bytes32.from([
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01
]);
console.log("Bytes32 (slot 1):", Hex.fromBytes(storageKey));

// Zero hash
const zeroHash = Bytes32.zero();
console.log("Bytes32 zero:", Hex.fromBytes(zeroHash));

// Random 32 bytes (like a private key)
const randomKey = Bytes32.random();
console.log("Bytes32 random:", Hex.fromBytes(randomKey));

// === Bytes64 (64 bytes) ===
// Signatures (r + s), public keys
const signature = Bytes64.from([
  // r (32 bytes)
  0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
  0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
  0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
  0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
  // s (32 bytes)
  0xfe, 0xdc, 0xba, 0x09, 0x87, 0x65, 0x43, 0x21,
  0xfe, 0xdc, 0xba, 0x09, 0x87, 0x65, 0x43, 0x21,
  0xfe, 0xdc, 0xba, 0x09, 0x87, 0x65, 0x43, 0x21,
  0xfe, 0xdc, 0xba, 0x09, 0x87, 0x65, 0x43, 0x21
]);
console.log("Bytes64 (sig):", Hex.fromBytes(signature).slice(0, 40) + "...");

// === Operations ===
// Equality check
const a = Bytes32.from(new Array(32).fill(0x01));
const b = Bytes32.from(new Array(32).fill(0x01));
console.log("Bytes equal:", Bytes.equals(a, b));

// Concatenation
const concat = Bytes.concat(transferSelector, storageKey);
console.log("Concat length:", concat.length, "bytes");

// Slicing
const sliced = Bytes.slice(concat, 0, 4);
console.log("Sliced (first 4):", Hex.fromBytes(sliced));
