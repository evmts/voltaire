import { sha256 } from "@noble/hashes/sha256";
import { encodePacked, type AbiParameter, AbiType } from "../../../native/primitives/abi.js";

// Helper to convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

// CREATE2 address calculation pattern
const create2Params: AbiParameter[] = [
	{ type: AbiType.Address, name: "deployer" },
	{ type: AbiType.Bytes32, name: "salt" },
];
const create2Values = [
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
	"0x0000000000000000000000000000000000000000000000000000000000000001",
];

// Signature verification pattern
const sigParams: AbiParameter[] = [
	{ type: AbiType.String, name: "action" },
	{ type: AbiType.Address, name: "to" },
	{ type: AbiType.Uint256, name: "amount" },
];
const sigValues = ["Transfer", "0x742d35cc6634c0532925a3b844bc9e7595f0beb1", 100n];

// Multi-value pattern
const multiParams: AbiParameter[] = [
	{ type: AbiType.Address, name: "addr" },
	{ type: AbiType.Uint256, name: "num" },
	{ type: AbiType.Bytes32, name: "hash" },
	{ type: AbiType.Bool, name: "flag" },
];
const multiValues = [
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
	42n,
	"0x1234567890123456789012345678901234567890123456789012345678901234",
	true,
];

export function main(): void {
	// Manual composition using @noble/hashes: sha256(encodePacked(...))
	bytesToHex(sha256(encodePacked(create2Params, create2Values)));
	bytesToHex(sha256(encodePacked(sigParams, sigValues)));
	bytesToHex(sha256(encodePacked(multiParams, multiValues)));
}
