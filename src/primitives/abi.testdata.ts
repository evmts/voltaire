/**
 * Test vectors for ABI encoding/decoding
 * Extracted from Zig implementation tests in abi_encoding.zig
 */

import type { Address } from "./address.js";

export interface EncodeTestVector {
  name: string;
  description: string;
  params: Array<{ type: string; value: any }>;
  expected: string; // hex string without 0x prefix
  source: string; // reference to Zig test line number
}

export interface DecodeTestVector {
  name: string;
  description: string;
  encoded: string; // hex string without 0x prefix
  types: string[];
  expected: any[];
  source: string;
}

export interface FunctionDataTestVector {
  name: string;
  description: string;
  signature: string;
  selector: string; // 4-byte hex without 0x
  params: Array<{ type: string; value: any }>;
  expectedCalldata: string; // full calldata hex without 0x
  source: string;
}

export interface SelectorTestVector {
  name: string;
  signature: string;
  expected: string; // 4-byte hex without 0x for functions, 32-byte for events
  source: string;
}

export interface ErrorTestVector {
  name: string;
  description: string;
  data: string; // hex without 0x
  types: string[];
  expectedError: string;
  source: string;
}

// ============================================================================
// SELECTOR TEST VECTORS (from lines 2678-2763)
// ============================================================================

export const selectorVectors: SelectorTestVector[] = [
  {
    name: "ERC20 transfer",
    signature: "transfer(address,uint256)",
    expected: "a9059cbb",
    source: "abi_encoding.zig:2678-2682",
  },
  {
    name: "ERC20 approve",
    signature: "approve(address,uint256)",
    expected: "095ea7b3",
    source: "abi_encoding.zig:2684-2688",
  },
  {
    name: "ERC20 balanceOf",
    signature: "balanceOf(address)",
    expected: "70a08231",
    source: "abi_encoding.zig:2690-2694",
  },
  {
    name: "Transfer event",
    signature: "Transfer(address,address,uint256)",
    expected:
      "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    source: "existing abi.test.ts:165-167",
  },
];

// ============================================================================
// BASIC ENCODING TEST VECTORS (from lines 1559-1708)
// ============================================================================

export const encodeVectors: EncodeTestVector[] = [
  {
    name: "uint256 basic",
    description: "Encode uint256 value 69420",
    params: [{ type: "uint256", value: 69420n }],
    expected:
      "0000000000000000000000000000000000000000000000000000000000010f2c",
    source: "abi_encoding.zig:1562-1573",
  },
  {
    name: "uint8 basic",
    description: "Encode uint8 value 32",
    params: [{ type: "uint8", value: 32 }],
    expected:
      "0000000000000000000000000000000000000000000000000000000000000020",
    source: "abi_encoding.zig:1575-1586",
  },
  {
    name: "address basic",
    description: "Encode standard Ethereum address",
    params: [
      {
        type: "address",
        value: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955" as Address,
      },
    ],
    expected:
      "00000000000000000000000014dc79964da2c08b23698b3d3cc7ca32193d9955",
    source: "abi_encoding.zig:1588-1604",
  },
  {
    name: "bool true",
    description: "Encode boolean true",
    params: [{ type: "bool", value: true }],
    expected:
      "0000000000000000000000000000000000000000000000000000000000000001",
    source: "abi_encoding.zig:1606-1617",
  },
  {
    name: "bool false",
    description: "Encode boolean false",
    params: [{ type: "bool", value: false }],
    expected:
      "0000000000000000000000000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:1619-1630",
  },
  {
    name: "int32 positive",
    description: "Encode positive int32 max value",
    params: [{ type: "int32", value: 2147483647 }],
    expected:
      "000000000000000000000000000000000000000000000000000000007fffffff",
    source: "abi_encoding.zig:1632-1643",
  },
  {
    name: "int32 negative",
    description: "Encode negative int32 min value (two's complement)",
    params: [{ type: "int32", value: -2147483648 }],
    expected:
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000",
    source: "abi_encoding.zig:1645-1656",
  },
  {
    name: "multiple static types",
    description: "Encode uint256, bool, and address together",
    params: [
      { type: "uint256", value: 420n },
      { type: "bool", value: true },
      {
        type: "address",
        value: "0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b" as Address,
      },
    ],
    expected:
      "00000000000000000000000000000000000000000000000000000000000001a40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c961145a54c96e3ae9baa048c4f4d6b04c13916b",
    source: "abi_encoding.zig:1658-1678",
  },
  {
    name: "string basic",
    description: "Encode string 'wagmi'",
    params: [{ type: "string", value: "wagmi" }],
    expected:
      "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:1680-1691",
  },
  {
    name: "mixed static and dynamic",
    description: "Encode string, uint256, and bool",
    params: [
      { type: "string", value: "wagmi" },
      { type: "uint256", value: 420n },
      { type: "bool", value: true },
    ],
    expected:
      "000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:1693-1708",
  },
];

// ============================================================================
// ROUND-TRIP ENCODING/DECODING VECTORS (lines 1711-1859)
// ============================================================================

export const roundTripVectors: Array<{
  name: string;
  description: string;
  params: Array<{ type: string; value: any }>;
  source: string;
}> = [
  {
    name: "all uint types",
    description: "Round-trip uint8, uint16, uint32, uint64",
    params: [
      { type: "uint8", value: 255 },
      { type: "uint16", value: 65535 },
      { type: "uint32", value: 4294967295 },
      { type: "uint64", value: 18446744073709551615n },
    ],
    source: "abi_encoding.zig:1711-1732",
  },
  {
    name: "all int types",
    description: "Round-trip int8, int16, int32, int64 minimum values",
    params: [
      { type: "int8", value: -128 },
      { type: "int16", value: -32768 },
      { type: "int32", value: -2147483648 },
      { type: "int64", value: -9223372036854775808n },
    ],
    source: "abi_encoding.zig:1734-1755",
  },
  {
    name: "fixed bytes types",
    description: "Round-trip bytes8 and bytes16",
    params: [
      { type: "bytes8", value: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]) },
      { type: "bytes16", value: new Uint8Array(16).fill(0xab) },
    ],
    source: "abi_encoding.zig:1775-1792",
  },
  {
    name: "dynamic bytes",
    description: "Round-trip dynamic bytes [0xde, 0xad, 0xbe, 0xef]",
    params: [
      { type: "bytes", value: new Uint8Array([0xde, 0xad, 0xbe, 0xef]) },
    ],
    source: "abi_encoding.zig:1794-1813",
  },
  {
    name: "large dynamic bytes",
    description: "Round-trip 1000-byte dynamic bytes",
    params: [{ type: "bytes", value: new Uint8Array(1000).fill(0xaa) }],
    source: "abi_encoding.zig:1815-1835",
  },
  {
    name: "uint256 array",
    description: "Round-trip uint256 array [1, 2, 3, 4, 5]",
    params: [{ type: "uint256[]", value: [1n, 2n, 3n, 4n, 5n] }],
    source: "abi_encoding.zig:1837-1859",
  },
];

// ============================================================================
// CROSS-VALIDATION VECTORS (lines 2906-3047)
// ============================================================================

export const crossValidationVectors: EncodeTestVector[] = [
  {
    name: "ethers.js ERC20 transfer",
    description:
      "ERC20 transfer parameters validated against ethers.js encoding",
    params: [
      {
        type: "address",
        value: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" as Address,
      },
      { type: "uint256", value: 1000000000000000000n },
    ],
    expected:
      "000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000de0b6b3a7640000",
    source: "abi_encoding.zig:2906-2929",
  },
  {
    name: "web3.js approve max",
    description: "ERC20 approve with max uint256 validated against web3.js",
    params: [
      {
        type: "address",
        value: "0x7a250d5630b4cf539939c1f07d1e3ea40f6063af" as Address,
      },
      {
        type: "uint256",
        value: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
      },
    ],
    expected:
      "0000000000000000000000007a250d5630b4cf539939c1f07d1e3ea40f6063afffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    source: "abi_encoding.zig:2931-2954",
  },
  {
    name: "viem string encoding",
    description: "String 'Hello World' validated against viem",
    params: [{ type: "string", value: "Hello World" }],
    expected:
      "0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b48656c6c6f20576f726c64000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:2956-2971",
  },
  {
    name: "ethers.js multiple parameters",
    description: "Multiple static types validated against ethers.js",
    params: [
      { type: "uint256", value: 420n },
      { type: "bool", value: true },
      {
        type: "address",
        value: "0xc961145a54c96e3ae9baa048c4f4d6b04c13916b" as Address,
      },
    ],
    expected:
      "00000000000000000000000000000000000000000000000000000000000001a40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c961145a54c96e3ae9baa048c4f4d6b04c13916b",
    source: "abi_encoding.zig:2973-2995",
  },
  {
    name: "bytes with known hash",
    description: "Bytes encoding [0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe]",
    params: [
      {
        type: "bytes",
        value: new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe]),
      },
    ],
    expected:
      "00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008deadbeefcafebabe0000000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:3031-3047",
  },
];

// ============================================================================
// BOUNDARY VALUE VECTORS (lines 2427-2677)
// ============================================================================

export const boundaryVectors: EncodeTestVector[] = [
  {
    name: "uint8 min",
    description: "uint8 minimum value (0)",
    params: [{ type: "uint8", value: 0 }],
    expected:
      "0000000000000000000000000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:2427-2444",
  },
  {
    name: "uint8 max",
    description: "uint8 maximum value (255)",
    params: [{ type: "uint8", value: 255 }],
    expected:
      "00000000000000000000000000000000000000000000000000000000000000ff",
    source: "abi_encoding.zig:2444-2461",
  },
  {
    name: "uint256 min",
    description: "uint256 minimum value (0)",
    params: [{ type: "uint256", value: 0n }],
    expected:
      "0000000000000000000000000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:2461-2478",
  },
  {
    name: "uint256 max",
    description: "uint256 maximum value (2^256-1)",
    params: [
      {
        type: "uint256",
        value: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
      },
    ],
    expected:
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    source: "abi_encoding.zig:2478-2496",
  },
  {
    name: "int8 min",
    description: "int8 minimum value (-128)",
    params: [{ type: "int8", value: -128 }],
    expected:
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff80",
    source: "abi_encoding.zig:2496-2513",
  },
  {
    name: "int8 max",
    description: "int8 maximum value (127)",
    params: [{ type: "int8", value: 127 }],
    expected:
      "000000000000000000000000000000000000000000000000000000000000007f",
    source: "abi_encoding.zig:2513-2530",
  },
  {
    name: "address zero",
    description: "Zero address (0x0000...0000)",
    params: [
      {
        type: "address",
        value: "0x0000000000000000000000000000000000000000" as Address,
      },
    ],
    expected:
      "0000000000000000000000000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:2566-2584",
  },
  {
    name: "address max",
    description: "Maximum address (0xFFFF...FFFF)",
    params: [
      {
        type: "address",
        value: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" as Address,
      },
    ],
    expected:
      "000000000000000000000000ffffffffffffffffffffffffffffffffffffffff",
    source: "abi_encoding.zig:2584-2602",
  },
  {
    name: "empty string",
    description: "Empty string encoding",
    params: [{ type: "string", value: "" }],
    expected:
      "00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
    source: "abi_encoding.zig:2623-2648",
  },
];

// ============================================================================
// COMPLEX MIXED TYPE VECTORS (lines 2002-2028)
// ============================================================================

export const complexVectors: Array<{
  name: string;
  description: string;
  params: Array<{ type: string; value: any }>;
  source: string;
}> = [
  {
    name: "complex mixed types",
    description: "uint256, string, uint256[], bool",
    params: [
      { type: "uint256", value: 42n },
      { type: "string", value: "test" },
      { type: "uint256[]", value: [100n, 200n, 300n] },
      { type: "bool", value: true },
    ],
    source: "abi_encoding.zig:2002-2028",
  },
];

// ============================================================================
// ERROR CONDITION VECTORS (lines 2769-2905)
// ============================================================================

export const errorVectors: ErrorTestVector[] = [
  {
    name: "truncated data",
    description: "Data too small for uint256 (only 3 bytes)",
    data: "010203",
    types: ["uint256"],
    expectedError: "DataTooSmall",
    source: "abi_encoding.zig:2769-2777",
  },
  {
    name: "invalid offset",
    description: "Dynamic offset beyond data bounds",
    data: "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f423f",
    types: ["string"],
    expectedError: "OutOfBounds",
    source: "abi_encoding.zig:2779-2789",
  },
  {
    name: "invalid UTF-8",
    description: "String with invalid UTF-8 bytes",
    data: "00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004fffffffefd000000000000000000000000000000000000000000000000000000",
    types: ["string"],
    expectedError: "InvalidUtf8",
    source: "abi_encoding.zig:2791-2806",
  },
  {
    name: "function data too small",
    description: "Function calldata less than 4 bytes (selector size)",
    data: "0102",
    types: [],
    expectedError: "DataTooSmall",
    source: "abi_encoding.zig:2808-2814",
  },
];

// ============================================================================
// FUNCTION DATA VECTORS (lines 2709-2738)
// ============================================================================

export const functionDataVectors: FunctionDataTestVector[] = [
  {
    name: "setValue(uint256)",
    description: "Function data with selector and single uint256 parameter",
    signature: "setValue(uint256)",
    selector: "", // Computed from signature
    params: [{ type: "uint256", value: 12345n }],
    expectedCalldata: "", // 36 bytes: 4-byte selector + 32-byte param
    source: "abi_encoding.zig:2709-2722",
  },
  {
    name: "getValue()",
    description: "Function data with selector and no parameters",
    signature: "getValue()",
    selector: "", // Computed from signature
    params: [],
    expectedCalldata: "", // 4 bytes: just selector
    source: "abi_encoding.zig:2724-2738",
  },
  {
    name: "transfer",
    description: "ERC20 transfer function call",
    signature: "transfer(address,uint256)",
    selector: "a9059cbb",
    params: [
      {
        type: "address",
        value: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" as Address,
      },
      { type: "uint256", value: 1000000000000000000n },
    ],
    expectedCalldata:
      "a9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000de0b6b3a7640000",
    source: "examples/abi.zig:46-79",
  },
];

// ============================================================================
// ARRAY TEST VECTORS (lines 2156-2425)
// ============================================================================

export const arrayVectors: Array<{
  name: string;
  description: string;
  params: Array<{ type: string; value: any }>;
  source: string;
}> = [
  {
    name: "empty uint256 array",
    description: "Dynamic array with no elements",
    params: [{ type: "uint256[]", value: [] }],
    source: "abi_encoding.zig:2156-2177",
  },
  {
    name: "single element uint256 array",
    description: "Dynamic array with one element",
    params: [{ type: "uint256[]", value: [42n] }],
    source: "abi_encoding.zig:2177-2199",
  },
  {
    name: "multiple address array",
    description: "Multiple addresses in dynamic array",
    params: [
      {
        type: "address[]",
        value: [
          "0x0000000000000000000000000000000000000001" as Address,
          "0x0000000000000000000000000000000000000002" as Address,
          "0x0000000000000000000000000000000000000003" as Address,
        ],
      },
    ],
    source: "abi_encoding.zig:2199-2226",
  },
  {
    name: "empty string array",
    description: "Dynamic string array with no elements",
    params: [{ type: "string[]", value: [] }],
    source: "abi_encoding.zig:2226-2250",
  },
  {
    name: "string array with empty strings",
    description: "String array containing empty strings",
    params: [{ type: "string[]", value: ["", "", ""] }],
    source: "abi_encoding.zig:2250-2277",
  },
  {
    name: "zero addresses array",
    description: "Address array with all zero addresses",
    params: [
      {
        type: "address[]",
        value: [
          "0x0000000000000000000000000000000000000000" as Address,
          "0x0000000000000000000000000000000000000000" as Address,
        ],
      },
    ],
    source: "abi_encoding.zig:2370-2395",
  },
];

// ============================================================================
// SECURITY TEST VECTORS (lines 3051-3180)
// ============================================================================

export const securityVectors: ErrorTestVector[] = [
  {
    name: "MAX_ABI_LENGTH decode",
    description: "Attempt to decode data claiming absurdly large length (DoS)",
    data: "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000013880000",
    types: ["string"],
    expectedError: "DataTooLarge",
    source: "abi_encoding.zig:3051-3072",
  },
];

// Helper to convert hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

// Helper to convert Uint8Array to hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
