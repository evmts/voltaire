/**
 * Example 2: RLP Encoding and Decoding
 *
 * Demonstrates:
 * - Encoding different data types to RLP
 * - Decoding RLP data
 * - Working with nested structures
 */

import * as Rlp from "../../src/primitives/Rlp/index.js";
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
const encoded = Rlp.encode(nested);
const rlpData = Rlp(
	new Uint8Array([0xc7, 0x83, 0x62, 0x61, 0x72, 0x83, 0x64, 0x6f, 0x67]),
);
const decoded = Rlp.decode(rlpData);
const original = [1n, "0x1234", [5n, 6n], "test"];
const encodedData = Rlp.encode(original);
const decodedData = Rlp.decode(encodedData);
const txData = [
	0n, // nonce
	20000000000n, // gasPrice
	21000n, // gasLimit
	"0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // to
	1000000000000000n, // value
	"0x", // data
];
const encodedTx = Rlp.encode(txData);
