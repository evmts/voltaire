import { Address, EIP712, Hex } from "voltaire";
// EIP-712: Encoding different value types

const types = {};

// Encode uint256 - 32 bytes, big-endian, right-aligned
const uint256 = EIP712.encodeValue("uint256", 42n, types);

// Encode large uint256
const largeUint = EIP712.encodeValue("uint256", 2n ** 128n, types);

// Encode address - 32 bytes, right-aligned (12-byte zero padding)
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const encodedAddr = EIP712.encodeValue("address", addr, types);

// Encode bool - 32 bytes, 0 or 1
const trueVal = EIP712.encodeValue("bool", true, types);
const falseVal = EIP712.encodeValue("bool", false, types);

// Encode string - keccak256 hash (dynamic type)
const str = EIP712.encodeValue("string", "Hello, World!", types);

// Encode dynamic bytes - keccak256 hash
const dynamicBytes = EIP712.encodeValue(
	"bytes",
	new Uint8Array([1, 2, 3]),
	types,
);

// Encode fixed bytes - left-aligned, zero-padded
const bytes4 = EIP712.encodeValue(
	"bytes4",
	new Uint8Array([0xab, 0xcd, 0xef, 0x12]),
	types,
);

// Encode array - keccak256 of concatenated encoded elements
const arr = EIP712.encodeValue("uint256[]", [1n, 2n, 3n], types);

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
