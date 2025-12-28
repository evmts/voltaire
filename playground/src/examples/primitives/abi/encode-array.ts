import { ABI } from "voltaire";

// Example: Encode dynamic uint256 array
const dynamicUintArray = ABI.encodeParameters(
	[{ type: "uint256[]", name: "values" }],
	[[1n, 2n, 3n, 4n, 5n]],
);

// Example: Encode fixed-size uint256 array
const fixedUintArray = ABI.encodeParameters(
	[{ type: "uint256[5]", name: "values" }],
	[[1n, 2n, 3n, 4n, 5n]],
);

// Example: Encode dynamic address array
const dynamicAddressArray = ABI.encodeParameters(
	[{ type: "address[]", name: "addresses" }],
	[
		[
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			"0x1234567890123456789012345678901234567890",
		],
	],
);

// Example: Encode fixed-size address array
const fixedAddressArray = ABI.encodeParameters(
	[{ type: "address[2]", name: "addresses" }],
	[
		[
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			"0x1234567890123456789012345678901234567890",
		],
	],
);

// Example: Encode dynamic bytes32 array
const dynamicBytes32Array = ABI.encodeParameters(
	[{ type: "bytes32[]", name: "hashes" }],
	[
		[
			new Uint8Array(32).fill(1),
			new Uint8Array(32).fill(2),
			new Uint8Array(32).fill(3),
		],
	],
);

// Example: Encode array of strings
const stringArray = ABI.encodeParameters(
	[{ type: "string[]", name: "names" }],
	[["Alice", "Bob", "Charlie"]],
);

// Example: Encode multidimensional array
const multiArray = ABI.encodeParameters(
	[{ type: "uint256[][]", name: "matrix" }],
	[
		[
			[1n, 2n],
			[3n, 4n],
			[5n, 6n],
		],
	],
);

// Example: Encode array of bool
const boolArray = ABI.encodeParameters(
	[{ type: "bool[]", name: "flags" }],
	[[true, false, true, true, false]],
);
