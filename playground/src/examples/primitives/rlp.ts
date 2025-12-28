import { Rlp, Hex, Address, Bytes } from "@tevm/voltaire";

// === RLP Encoding ===
// Encode single byte (< 0x80)
const singleByte = Rlp.encode(Bytes([0x42]));
console.log("Single byte:", singleByte.toHex());

// Encode bytes array
const bytes = Bytes([0x01, 0x02, 0x03, 0x04, 0x05]);
const encodedBytes = Rlp.encode(bytes);
console.log("Bytes:", encodedBytes.toHex());

// Encode string as bytes
const textEncoder = new TextEncoder();
const stringData = textEncoder.encode("hello");
const encodedString = Rlp.encode(stringData);
console.log("String 'hello':", encodedString.toHex());

// Encode list (array)
const list = [
  Bytes([0x01]),
  Bytes([0x02]),
  Bytes([0x03])
];
const encodedList = Rlp.encode(list);
console.log("List [1,2,3]:", encodedList.toHex());

// Encode nested list
const nested = [
  Bytes([0x01]),
  [Bytes([0x02]), Bytes([0x03])],
  [[Bytes([0x04])]]
];
const encodedNested = Rlp.encode(nested);
console.log("Nested list:", encodedNested.toHex());

// === RLP Decoding ===
// Decode bytes
const decodedBytes = Rlp.decode(encodedBytes);
console.log("Decoded bytes:", decodedBytes);

// Decode list
const decodedList = Rlp.decode(encodedList);
console.log("Decoded list:", decodedList);

// === Transaction-like Structure ===
const txData = [
  Bytes([0x09]),                     // nonce: 9
  Bytes([0x04, 0xa8, 0x17, 0xc8, 0x00]), // gasPrice: 20 gwei
  Bytes([0x52, 0x08]),               // gasLimit: 21000
  Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"), // to
  Bytes([0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00]), // value: 1 ETH
  Bytes([])                          // data: empty
];
const encodedTx = Rlp.encode(txData);
console.log("Encoded tx:", encodedTx.toHex());

// Decode back
const decodedTx = Rlp.decode(encodedTx);
console.log("Decoded tx fields:", (decodedTx as unknown[]).length);

// === Empty Values ===
const emptyBytes = Rlp.encode(Bytes([]));
const emptyList = Rlp.encode([]);
console.log("Empty bytes:", emptyBytes.toHex());
console.log("Empty list:", emptyList.toHex());

// === Length Calculation ===
const longData = Bytes.repeat(0xab, 1000);
const encodedLong = Rlp.encode(longData);
console.log("Long data encoded length:", encodedLong.length);
