import { Bytes, Hex, Rlp } from "@tevm/voltaire";
// Example: Universal RLP encoding

// Encode Bytes (as bytes)
const bytes = Bytes([0x01, 0x02, 0x03]);
const encoded1 = Rlp.encode(bytes);
// Output: 0x83010203

// Encode array (as list)
const array = [Bytes([0x01]), Bytes([0x02])];
const encoded2 = Rlp.encode(array);
// Output: 0xc20102

// Encode BrandedRlp data
const rlpData = Rlp(Bytes([0xff]));
const encoded3 = Rlp.encode(rlpData);
// Output: 0x81ff

// Encode nested arrays
const nested = [Bytes([0x01]), [Bytes([0x02])], [[Bytes([0x03])]]];
const encoded4 = Rlp.encode(nested);

// Encode string data
const stringData = Bytes.fromString("hello");
const encoded5 = Rlp.encode(stringData);
// Output: 0x8568656c6c6f

// Encode transaction-like structure
const txData = [
	Bytes([0x09]), // nonce
	Bytes([0x04, 0xa8, 0x17, 0xc8, 0x00]), // gasPrice
	Bytes([0x52, 0x08]), // gasLimit
	Bytes.repeat(0x01, 20), // to address
	Bytes([0x00]), // value
	Bytes.zero(0), // data
];
const encoded6 = Rlp.encode(txData);
