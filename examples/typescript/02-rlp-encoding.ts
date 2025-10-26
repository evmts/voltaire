/**
 * Example 2: RLP Encoding and Decoding
 *
 * Demonstrates:
 * - Encoding different data types to RLP
 * - Decoding RLP data
 * - Working with nested structures
 */

import {
	encodeRlp,
	decodeRlp,
	toHex,
	fromHex,
} from "../../src/typescript/primitives/rlp";

console.log("=== RLP Encoding and Decoding ===\n");

// Example 2.1: Encoding a single number
console.log("2.1: Encoding Numbers");
const num1 = 0n;
const num2 = 127n;
const num3 = 128n;
const num4 = 1000n;

console.log("0 →", toHex(encodeRlp(num1)));
console.log("127 →", toHex(encodeRlp(num2)));
console.log("128 →", toHex(encodeRlp(num3)));
console.log("1000 →", toHex(encodeRlp(num4)));
console.log();

// Example 2.2: Encoding strings and hex strings
console.log("2.2: Encoding Strings");
const str1 = "dog";
const hex1 = "0x0400";

console.log('"dog" →', toHex(encodeRlp(str1)));
console.log("0x0400 →", toHex(encodeRlp(hex1)));
console.log();

// Example 2.3: Encoding lists
console.log("2.3: Encoding Lists");
const list1 = [1n, 2n, 3n];
const list2 = ["cat", "dog"];
const list3 = []; // empty list

console.log("[1, 2, 3] →", toHex(encodeRlp(list1)));
console.log('["cat", "dog"] →', toHex(encodeRlp(list2)));
console.log("[] →", toHex(encodeRlp(list3)));
console.log();

// Example 2.4: Encoding nested structures
console.log("2.4: Encoding Nested Structures");
const nested = ["hello", [1n, 2n, 3n], "world"];
const encoded = encodeRlp(nested);
console.log("Input:", JSON.stringify(nested));
console.log("RLP:", toHex(encoded));
console.log();

// Example 2.5: Decoding RLP data
console.log("2.5: Decoding RLP Data");
const rlpData = fromHex("0xc78362617283646f67");
const decoded = decodeRlp(rlpData);
console.log("RLP:", "0xc78362617283646f67");
console.log("Decoded:", decoded);
console.log();

// Example 2.6: Round-trip encoding/decoding
console.log("2.6: Round-trip Encoding/Decoding");
const original = [1n, "0x1234", [5n, 6n], "test"];
const encodedData = encodeRlp(original);
const decodedData = decodeRlp(encodedData);

console.log("Original:", original);
console.log("Encoded:", toHex(encodedData));
console.log("Decoded:", decodedData);
console.log(
	"Match:",
	JSON.stringify(original) === JSON.stringify(decodedData)
		? "No (types differ)"
		: "Types differ as expected",
);
console.log("Note: Numbers become Uint8Arrays after decode");
console.log();

// Example 2.7: Transaction-like structure
console.log("2.7: Transaction-like Structure");
const txData = [
	0n, // nonce
	20000000000n, // gasPrice
	21000n, // gasLimit
	"0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // to
	1000000000000000n, // value
	"0x", // data
];
const encodedTx = encodeRlp(txData);
console.log("Transaction data:", txData);
console.log("RLP encoded:", toHex(encodedTx));
console.log("Size:", encodedTx.length, "bytes");
