/**
 * Example 1: Hex Utilities and Keccak-256 Hashing
 *
 * Demonstrates:
 * - Converting between hex strings and byte arrays
 * - Computing Keccak-256 hashes
 * - Working with hex data
 */

import {
	keccak256,
	keccak256Hex,
} from "../../src/typescript/primitives/keccak";
import { bytesToHex, hexToBytes } from "../../src/typescript/utils/hex";
const hexString = "0x48656c6c6f20576f726c64"; // "Hello World" in hex
const bytes = hexToBytes(hexString);
const message = "Hello World";
const messageBytes = new TextEncoder().encode(message);
const messageHex = bytesToHex(messageBytes);
const data = new TextEncoder().encode("test");
const hash = keccak256(data);
const hashHex = bytesToHex(hash);
const hexData = "0x1234567890abcdef";
const hexHash = keccak256Hex(hexData);
const emptyHash = keccak256Hex("0x");
const functionSig = "transfer(address,uint256)";
const sigBytes = new TextEncoder().encode(functionSig);
const sigHash = keccak256(sigBytes);
const selector = bytesToHex(sigHash.slice(0, 4));
const eventSig = "Transfer(address,address,uint256)";
const eventBytes = new TextEncoder().encode(eventSig);
const eventHash = keccak256(eventBytes);
