/**
 * String Encoding Example
 *
 * Demonstrates:
 * - UTF-8 string encoding to hex
 * - Hex decoding to UTF-8 strings
 * - Working with emoji and multi-byte characters
 * - Round-trip conversions
 * - Common string encoding patterns
 */

import { Hex } from "@tevm/voltaire";

const text1 = "hello";
const hex1 = Hex.fromString(text1);

// Decode back
const decoded1 = Hex.toString(hex1);

// Empty string
const empty = "";
const hexEmpty = Hex.fromString(empty);

const text2 = "Hello, Ethereum!";
const hex2 = Hex.fromString(text2);

// Decode
const decoded2 = Hex.toString(hex2);

const emojis = ["🔥", "🚀", "💎", "🌊", "⚡"];

emojis.forEach((emoji) => {
	const hex = Hex.fromString(emoji);
	const decoded = Hex.toString(hex);
});

// Multiple emojis
const multiEmoji = "🔥🚀💎";
const hexMulti = Hex.fromString(multiEmoji);

const languages = [
	{ lang: "English", text: "Hello" },
	{ lang: "Spanish", text: "Hola" },
	{ lang: "Japanese", text: "こんにちは" },
	{ lang: "Russian", text: "Привет" },
	{ lang: "Arabic", text: "مرحبا" },
	{ lang: "Chinese", text: "你好" },
];

languages.forEach(({ lang, text }) => {
	const hex = Hex.fromString(text);
	const decoded = Hex.toString(hex);
});

// Token name
const tokenName = "MyToken";
const nameHex = Hex.fromString(tokenName);

// Token symbol
const symbol = "MTK";
const symbolHex = Hex.fromString(symbol);

// URI/URL
const uri = "https://example.com/metadata/1";
const uriHex = Hex.fromString(uri);

const errorMessage = "Insufficient balance";
const errorHex = Hex.fromString(errorMessage);

// Revert reason (typically starts with Error(string) selector)
const ERROR_SELECTOR = Hex("0x08c379a0"); // Error(string)
const encodedError = Hex.concat(
	ERROR_SELECTOR,
	Hex.fromBigInt(32n, 32), // offset
	Hex.fromBigInt(BigInt(errorMessage.length), 32), // length
	Hex.padRight(errorHex, 32), // data (right-padded to 32 bytes)
);

const signatures = [
	"transfer(address,uint256)",
	"approve(address,uint256)",
	"balanceOf(address)",
	"totalSupply()",
];

signatures.forEach((sig) => {
	const hex = Hex.fromString(sig);
	// In practice, you'd take keccak256(hex).slice(0, 4) for the selector
});

const eventSignatures = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
	"Mint(address,uint256)",
	"Burn(address,uint256)",
];

eventSignatures.forEach((sig) => {
	const hex = Hex.fromString(sig);
	// In practice, you'd take keccak256(hex) for the topic
});

const message = "Hello";
const messageHex = Hex.fromString(message);

// String ABI encoding: offset + length + data (right-padded)
const offset = Hex.fromBigInt(32n, 32);
const length = Hex.fromBigInt(BigInt(message.length), 32);
const paddedData = Hex.padRight(messageHex, 32);

const encoded = Hex.concat(offset, length, paddedData);

// Decode
const decodedLength = Hex.toNumber(Hex.slice(encoded, 32, 64));
const encodedData = Hex.slice(encoded, 64, 96);
const trimmedData = Hex.slice(encodedData, 0, decodedLength);
const decodedMessage = Hex.toString(trimmedData);

const specialChars = [
	{ name: "Newline", char: "\n", desc: "\\n" },
	{ name: "Tab", char: "\t", desc: "\\t" },
	{ name: "Quote", char: '"', desc: '\\"' },
	{ name: "Backslash", char: "\\", desc: "\\\\" },
];

specialChars.forEach(({ name, char, desc }) => {
	const hex = Hex.fromString(char);
	const decoded = Hex.toString(hex);
});

const longText = "The quick brown fox jumps over the lazy dog. ".repeat(5);
const longHex = Hex.fromString(longText);

// Verify round-trip
const decodedLong = Hex.toString(longHex);
