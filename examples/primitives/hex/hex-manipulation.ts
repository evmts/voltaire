/**
 * Hex Manipulation Example
 *
 * Demonstrates:
 * - Concatenating hex strings
 * - Slicing hex data
 * - Padding (left and right)
 * - Trimming zeros
 * - XOR operations
 */

import { Hex } from "@tevm/voltaire";

const part1 = Hex("0x12");
const part2 = Hex("0x34");
const part3 = Hex("0x56");

const combined = Hex.concat(part1, part2, part3);

// Build transaction data (function selector + arguments)
const selector = Hex("0xa9059cbb"); // transfer(address,uint256)
const recipient = Hex.pad(
	Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	32,
);
const amount = Hex.fromBigInt(1000000n, 32);
const txData = Hex.concat(selector, recipient, amount);

const data = Hex("0x123456789abc");

// Extract function selector (first 4 bytes)
const calldata = Hex("0xa9059cbb000000000000000000000000742d35cc");
const extractedSelector = Hex.slice(calldata, 0, 4);

const short = Hex("0x1234");

// Pad left (prepend zeros) - used for numbers, addresses
const padded4 = Hex.pad(short, 4);

const padded32 = Hex.pad(short, 32);

// Pad right (append zeros) - used for strings/bytes
const paddedRight = Hex.padRight(short, 4);

// Ethereum use case: address to U256
const address = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
const addressAsU256 = Hex.pad(address, 32);

const padded = Hex("0x00001234");

const trimmed = Hex.trim(padded);

// Trim all zeros
const allZeros = Hex("0x00000000");
const trimmedZeros = Hex.trim(allZeros);

// Compact storage value
const storageValue = Hex.fromBigInt(255n, 32);
const compact = Hex.trim(storageValue);

const a = Hex("0x12");
const b = Hex("0x34");
const xorResult = Hex.xor(a, b);

// XOR properties
const self = Hex("0x1234");
const selfXor = Hex.xor(self, self);

// XOR for masking
const value = Hex("0xff00");
const mask = Hex("0x00ff");
const masked = Hex.xor(value, mask);

// XOR is reversible: xor(xor(a, b), b) === a
const original = Hex("0xabcd");
const key = Hex("0x1234");
const encrypted = Hex.xor(original, key);
const decrypted = Hex.xor(encrypted, key);

const transferSelector = Hex("0xa9059cbb");
const recipientAddress = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
const transferAmount = 1000000000000000000n; // 1 token (18 decimals)

// Pad address and amount to 32 bytes each
const paddedRecipient = Hex.pad(recipientAddress, 32);
const paddedAmount = Hex.fromBigInt(transferAmount, 32);

// Concatenate: selector + recipient + amount
const callData = Hex.concat(transferSelector, paddedRecipient, paddedAmount);

// Decode it back
const decodedSelector = Hex.slice(callData, 0, 4);
const decodedRecipient = Hex.trim(Hex.slice(callData, 4, 36));
const decodedAmount = Hex.toBigInt(Hex.slice(callData, 36, 68));
