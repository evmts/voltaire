/**
 * Example 2: RLP Encoding and Decoding
 *
 * Demonstrates:
 * - Encoding different data types to RLP
 * - Decoding RLP data
 * - Working with nested structures
 */

import {
	decodeRlp,
	encodeRlp,
	fromHex,
	toHex,
} from "../../src/typescript/primitives/rlp";
const num1 = 0n;
const num2 = 127n;
const num3 = 128n;
const num4 = 1000n;
const str1 = "dog";
const hex1 = "0x0400";
const list1 = [1n, 2n, 3n];
const list2 = ["cat", "dog"];
const list3 = []; // empty list
const nested = ["hello", [1n, 2n, 3n], "world"];
const encoded = encodeRlp(nested);
const rlpData = fromHex("0xc78362617283646f67");
const decoded = decodeRlp(rlpData);
const original = [1n, "0x1234", [5n, 6n], "test"];
const encodedData = encodeRlp(original);
const decodedData = decodeRlp(encodedData);
const txData = [
	0n, // nonce
	20000000000n, // gasPrice
	21000n, // gasLimit
	"0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // to
	1000000000000000n, // value
	"0x", // data
];
const encodedTx = encodeRlp(txData);
