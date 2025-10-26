import { solidityPackedSha256 } from "ethers";

// CREATE2 address calculation pattern
const create2Types = ["address", "bytes32"];
const create2Values = [
	"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
	"0x0000000000000000000000000000000000000000000000000000000000000001",
];

// Signature verification pattern
const sigTypes = ["string", "address", "uint256"];
const sigValues = ["Transfer", "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", 100n];

// Multi-value pattern
const multiTypes = ["address", "uint256", "bytes32", "bool"];
const multiValues = [
	"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
	42n,
	"0x1234567890123456789012345678901234567890123456789012345678901234",
	true,
];

export function main(): void {
	// Single function call
	solidityPackedSha256(create2Types, create2Values);
	solidityPackedSha256(sigTypes, sigValues);
	solidityPackedSha256(multiTypes, multiValues);
}
