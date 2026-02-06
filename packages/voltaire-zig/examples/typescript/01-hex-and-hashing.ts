/**
 * Example 1: Hex Utilities and Keccak-256 Hashing
 *
 * Demonstrates:
 * - Converting between hex strings and byte arrays
 * - Computing Keccak-256 hashes
 * - Working with hex data
 */

import { Hex, Keccak256 } from "@tevm/voltaire";

const hexString = "0x48656c6c6f20576f726c64"; // "Hello World" in hex
const bytes = Hex.toBytes(hexString);

const message = "Hello World";
const messageBytes = new TextEncoder().encode(message);
const messageHex = Hex.fromBytes(messageBytes);

const data = new TextEncoder().encode("test");
const hash = Keccak256.hash(data);
const hashHex = Hex.fromBytes(hash);

const hexData = "0x1234567890abcdef";
const hexHash = Keccak256.hashHex(hexData);
const emptyHash = Keccak256.hashHex("0x");

const functionSig = "transfer(address,uint256)";
const selector = Keccak256.selector(functionSig);

const eventSig = "Transfer(address,address,uint256)";
const eventTopic = Keccak256.topic(eventSig);
