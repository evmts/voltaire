import * as Rlp from "../../../primitives/RLP/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Universal RLP encoding

// Encode Uint8Array (as bytes)
const bytes = new Uint8Array([0x01, 0x02, 0x03]);
const encoded1 = Rlp.encode(bytes);
console.log("Bytes:", encoded1.toHex());
// Output: 0x83010203

// Encode array (as list)
const array = [new Uint8Array([0x01]), new Uint8Array([0x02])];
const encoded2 = Rlp.encode(array);
console.log("Array:", encoded2.toHex());
// Output: 0xc20102

// Encode BrandedRlp data
const rlpData = Rlp.from(new Uint8Array([0xff]));
const encoded3 = Rlp.encode(rlpData);
console.log("BrandedRlp:", encoded3.toHex());
// Output: 0x81ff

// Encode nested arrays
const nested = [
	new Uint8Array([0x01]),
	[new Uint8Array([0x02])],
	[[new Uint8Array([0x03])]],
];
const encoded4 = Rlp.encode(nested);
console.log("Nested structure:", encoded4.toHex());

// Encode string data
const textEncoder = new TextEncoder();
const stringData = textEncoder.encode("hello");
const encoded5 = Rlp.encode(stringData);
console.log('String "hello":', encoded5.toHex());
// Output: 0x8568656c6c6f

// Encode transaction-like structure
const txData = [
	new Uint8Array([0x09]), // nonce
	new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]), // gasPrice
	new Uint8Array([0x52, 0x08]), // gasLimit
	new Uint8Array(20).fill(0x01), // to address
	new Uint8Array([0x00]), // value
	new Uint8Array([]), // data
];
const encoded6 = Rlp.encode(txData);
console.log("Transaction structure - length:", encoded6.length, "bytes");
console.log("Transaction hex:", encoded6.toHex());
