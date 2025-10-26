import { AbiCoder } from "ethers";

const abiCoder = AbiCoder.defaultAbiCoder();

// Simple test case: single uint256
const simpleTypes = ["uint256"];
const simpleValues = [42n];
const simpleEncoded = abiCoder.encode(simpleTypes, simpleValues);

// Complex test case: address, bytes32, uint256 array, and string
const complexTypes = ["address", "bytes32", "uint256[]", "string"];
const complexValues = [
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
	new Uint8Array(32).fill(0xff),
	[100n, 200n, 300n],
	"Hello, Ethereum!",
];
const complexEncoded = abiCoder.encode(complexTypes, complexValues);

export function main(): void {
	// Run both simple and complex decodings
	abiCoder.decode(simpleTypes, simpleEncoded);
	abiCoder.decode(complexTypes, complexEncoded);
}
