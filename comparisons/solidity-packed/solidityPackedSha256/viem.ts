import { encodePacked, sha256 } from "viem";

// CREATE2 address calculation pattern
const create2Types = ["address", "bytes32"] as const;
const create2Values = [
	"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
	"0x0000000000000000000000000000000000000000000000000000000000000001",
] as const;

// Signature verification pattern
const sigTypes = ["string", "address", "uint256"] as const;
const sigValues = [
	"Transfer",
	"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
	100n,
] as const;

// Multi-value pattern
const multiTypes = ["address", "uint256", "bytes32", "bool"] as const;
const multiValues = [
	"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
	42n,
	"0x1234567890123456789012345678901234567890123456789012345678901234",
	true,
] as const;

export function main(): void {
	// Manual composition: sha256(encodePacked(...))
	sha256(encodePacked(create2Types, create2Values));
	sha256(encodePacked(sigTypes, sigValues));
	sha256(encodePacked(multiTypes, multiValues));
}
