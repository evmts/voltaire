// EIP-712: Encoding different value types
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

const types = {};

// Encode uint256 - 32 bytes, big-endian, right-aligned
const uint256 = EIP712.encodeValue("uint256", 42n, types);
console.log("uint256(42):", Hex.fromBytes(uint256).toString());
console.log("Last byte:", uint256[31]); // 42

// Encode large uint256
const largeUint = EIP712.encodeValue("uint256", 2n ** 128n, types);
console.log(
	"uint256(2^128):",
	Hex.fromBytes(largeUint).toString().slice(0, 20) + "...",
);

// Encode address - 32 bytes, right-aligned (12-byte zero padding)
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const encodedAddr = EIP712.encodeValue("address", addr, types);
console.log("address:", Hex.fromBytes(encodedAddr).toString());
console.log(
	"First 12 bytes zero:",
	encodedAddr.slice(0, 12).every((b) => b === 0),
);

// Encode bool - 32 bytes, 0 or 1
const trueVal = EIP712.encodeValue("bool", true, types);
const falseVal = EIP712.encodeValue("bool", false, types);
console.log("bool(true) last byte:", trueVal[31]); // 1
console.log("bool(false) last byte:", falseVal[31]); // 0

// Encode string - keccak256 hash (dynamic type)
const str = EIP712.encodeValue("string", "Hello, World!", types);
console.log(
	"string (hashed):",
	Hex.fromBytes(str).toString().slice(0, 20) + "...",
);

// Encode dynamic bytes - keccak256 hash
const dynamicBytes = EIP712.encodeValue(
	"bytes",
	new Uint8Array([1, 2, 3]),
	types,
);
console.log(
	"bytes (hashed):",
	Hex.fromBytes(dynamicBytes).toString().slice(0, 20) + "...",
);

// Encode fixed bytes - left-aligned, zero-padded
const bytes4 = EIP712.encodeValue(
	"bytes4",
	new Uint8Array([0xab, 0xcd, 0xef, 0x12]),
	types,
);
console.log("bytes4:", Hex.fromBytes(bytes4).toString());
console.log(
	"First 4 bytes match:",
	bytes4.slice(0, 4).every((b, i) => b === [0xab, 0xcd, 0xef, 0x12][i]),
);
console.log(
	"Remaining bytes zero:",
	bytes4.slice(4).every((b) => b === 0),
);

// Encode array - keccak256 of concatenated encoded elements
const arr = EIP712.encodeValue("uint256[]", [1n, 2n, 3n], types);
console.log(
	"uint256[] (hashed):",
	Hex.fromBytes(arr).toString().slice(0, 20) + "...",
);

// Encode custom struct
const personTypes = {
	Person: [
		{ name: "name", type: "string" },
		{ name: "age", type: "uint256" },
	],
};
const person = EIP712.encodeValue(
	"Person",
	{ name: "Alice", age: 30n },
	personTypes,
);
console.log(
	"Person struct (hashed):",
	Hex.fromBytes(person).toString().slice(0, 20) + "...",
);
