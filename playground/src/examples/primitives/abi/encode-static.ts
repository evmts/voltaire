import { ABI, Bytes, Bytes32 } from "@tevm/voltaire";

// Example: Encode static uint types
const uintParams = ABI.encodeParameters(
	[
		{ type: "uint8", name: "small" },
		{ type: "uint16", name: "medium" },
		{ type: "uint32", name: "large" },
		{ type: "uint256", name: "max" },
	],
	[
		255,
		65535,
		4294967295,
		115792089237316195423570985008687907853269984665640564039457584007913129639935n,
	],
);

// Example: Encode static int types
const intParams = ABI.encodeParameters(
	[
		{ type: "int8", name: "small" },
		{ type: "int16", name: "medium" },
		{ type: "int32", name: "large" },
		{ type: "int256", name: "signed" },
	],
	[-128, -32768, -2147483648, -1000000n],
);

// Example: Encode static address type
const addressParams = ABI.encodeParameters(
	[
		{ type: "address", name: "token" },
		{ type: "address", name: "owner" },
	],
	[
		"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		"0x1234567890123456789012345678901234567890",
	],
);

// Example: Encode static bool type
const boolParams = ABI.encodeParameters(
	[
		{ type: "bool", name: "isActive" },
		{ type: "bool", name: "isPaused" },
	],
	[true, false],
);

// Example: Encode static bytes types
const bytesParams = ABI.encodeParameters(
	[
		{ type: "bytes1", name: "single" },
		{ type: "bytes4", name: "selector" },
		{ type: "bytes32", name: "hash" },
	],
	[Bytes([0xff]), Bytes([0xa9, 0x05, 0x9c, 0xbb]), Bytes32.zero().fill(1)],
);
