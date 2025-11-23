import * as Rlp from '../../../primitives/RLP/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Example: RLP utility functions

// Get encoded length without encoding
const data1 = new Uint8Array([0x01, 0x02, 0x03]);
const length1 = Rlp.getEncodedLength(data1);
console.log('Encoded length for 3 bytes:', length1); // 4 bytes (1 prefix + 3 data)

const data2 = new Uint8Array(56).fill(0xff);
const length2 = Rlp.getEncodedLength(data2);
console.log('Encoded length for 56 bytes:', length2); // 58 bytes (1 prefix + 1 length + 56 data)

// Check if data is list or string
const encoded1 = Rlp.encode(new Uint8Array([0x01, 0x02]));
console.log('Is string:', Rlp.isString(encoded1)); // true
console.log('Is list:', Rlp.isList(encoded1)); // false

const encoded2 = Rlp.encode([new Uint8Array([0x01])]);
console.log('Is string:', Rlp.isString(encoded2)); // false
console.log('Is list:', Rlp.isList(encoded2)); // true

// Flatten nested structure
const nested = Rlp.from([
  new Uint8Array([0x01]),
  [new Uint8Array([0x02]), new Uint8Array([0x03])],
  [[new Uint8Array([0x04])]]
]);
const flattened = Rlp.flatten(nested);
console.log('Flattened items:', flattened.length); // 4 items total

// Compare RLP data
const data3 = Rlp.from(new Uint8Array([0x01, 0x02, 0x03]));
const data4 = Rlp.from(new Uint8Array([0x01, 0x02, 0x03]));
const data5 = Rlp.from(new Uint8Array([0x01, 0x02, 0x04]));
console.log('data3 equals data4:', Rlp.equals(data3, data4)); // true
console.log('data3 equals data5:', Rlp.equals(data3, data5)); // false

// Convert to/from JSON
const original = Rlp.from(new Uint8Array([0x01, 0x02, 0x03]));
const json = Rlp.toJSON(original);
console.log('JSON representation:', json);
const restored = Rlp.fromJSON(json);
console.log('Restored equals original:', Rlp.equals(restored, original));

// Convert to raw format
const rlpData = Rlp.from([
  new Uint8Array([0x01]),
  new Uint8Array([0x02, 0x03])
]);
const raw = Rlp.toRaw(rlpData);
console.log('Raw format:', raw);

// Validate RLP encoding
const valid = Hex.fromHex('0x83010203');
const isValid = Rlp.validate(valid);
console.log('Valid RLP:', isValid); // true

const invalid = new Uint8Array([0x83, 0x01]); // Claims 3 bytes, has 1
const isInvalid = Rlp.validate(invalid);
console.log('Invalid RLP:', isInvalid); // false

// Get length of encoded data
const encoded = Hex.fromHex('0x83010203');
const dataLength = Rlp.getLength(encoded);
console.log('Data length from encoded:', dataLength); // 4 bytes total
