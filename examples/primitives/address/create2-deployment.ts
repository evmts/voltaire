/**
 * CREATE2 Contract Deployment Address Example
 *
 * Demonstrates:
 * - Calculating CREATE2 contract addresses (salt-based)
 * - Deterministic deployments with salts
 * - Vanity address mining
 * - Cross-chain deployment consistency
 * - Factory pattern implementation
 */

import { Address } from "../../../src/primitives/Address/index.js";
import { Bytes } from "../../../src/primitives/Bytes/index.js";

const deployer = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Contract initialization code (bytecode)
const initCode = Bytes.fromHex("0x608060405234801561001057600080fd5b50");

// Calculate with different salts
const salt1 = 0n;
const salt2 = 42n;
const salt3 = 0xcafebaben;

const contract1 = deployer.calculateCreate2Address(salt1, initCode);
const contract2 = deployer.calculateCreate2Address(salt2, initCode);
const contract3 = deployer.calculateCreate2Address(salt3, initCode);

// Same inputs always produce same address
const addr1 = deployer.calculateCreate2Address(42n, initCode);
const addr2 = deployer.calculateCreate2Address(42n, initCode);

// Different init code = different address
const initCode2 = Bytes.fromHex("0x608060405234801561001057600080fd5b51");
const differentAddr = deployer.calculateCreate2Address(42n, initCode2);

class Create2Factory {
	private factoryAddr: Address;

	constructor(factoryAddress: Address) {
		this.factoryAddr = factoryAddress;
	}

	// Predict deployment address
	predictAddress(salt: bigint, initCode: Uint8Array): Address {
		return this.factoryAddr.calculateCreate2Address(salt, initCode);
	}

	// Find if target address is achievable
	findSalt(
		targetAddr: Address,
		initCode: Uint8Array,
		maxAttempts = 1000000,
	): bigint | null {
		for (let salt = 0n; salt < BigInt(maxAttempts); salt++) {
			const predicted = this.predictAddress(salt, initCode);
			if (predicted.equals(targetAddr)) {
				return salt;
			}
		}
		return null;
	}

	// Generate addresses for multiple salts
	batchPredict(salts: bigint[], initCode: Uint8Array): Map<bigint, Address> {
		const results = new Map<bigint, Address>();
		for (const salt of salts) {
			const addr = this.predictAddress(salt, initCode);
			results.set(salt, addr);
		}
		return results;
	}
}

const factory = new Create2Factory(deployer);

// Batch prediction
const salts = [0n, 1n, 2n, 3n, 4n];
const predicted = factory.batchPredict(salts, initCode);
predicted.forEach((addr, salt) => {});

function mineVanityAddress(
	factory: Address,
	initCode: Uint8Array,
	prefix: Uint8Array,
	maxAttempts = 100000,
): { address: Address; salt: bigint } | null {
	for (let salt = 0n; salt < BigInt(maxAttempts); salt++) {
		const addr = factory.calculateCreate2Address(salt, initCode);

		// Check if address starts with prefix
		let matches = true;
		for (let i = 0; i < prefix.length; i++) {
			if (addr[i] !== prefix[i]) {
				matches = false;
				break;
			}
		}

		if (matches) {
			return { address: addr, salt };
		}
	}

	return null;
}
const prefix = new Uint8Array([0x00, 0x00]);
const result = mineVanityAddress(deployer, initCode, prefix);

if (result) {
} else {
}

// Same factory + salt + init code = same address on all chains
const chainDeployers = new Map([
	["Ethereum", Address.fromHex("0x4e59b44847b379578588920cA78FbF26c0B4956C")],
	["Optimism", Address.fromHex("0x4e59b44847b379578588920cA78FbF26c0B4956C")],
	["Arbitrum", Address.fromHex("0x4e59b44847b379578588920cA78FbF26c0B4956C")],
]);

const crossChainSalt = 12345n;
const crossChainInit = Bytes.fromHex("0x608060405234801561001057600080fd5b50");
chainDeployers.forEach((factoryAddr, chain) => {
	const addr = factoryAddr.calculateCreate2Address(
		crossChainSalt,
		crossChainInit,
	);
});

// Salt as bigint
const saltBigInt = 42n;
const addrFromBigInt = deployer.calculateCreate2Address(saltBigInt, initCode);

// Salt as Uint8Array (must be 32 bytes)
const saltBytes = new Uint8Array(32);
saltBytes[31] = 42; // Last byte = 42
const addrFromBytes = deployer.calculateCreate2Address(saltBytes, initCode);

// Wrong salt size (Uint8Array)
try {
	const wrongSalt = new Uint8Array(16); // Must be 32 bytes
	deployer.calculateCreate2Address(wrongSalt, initCode);
} catch (e) {}

// Negative salt (bigint)
try {
	deployer.calculateCreate2Address(-1n, initCode);
} catch (e) {}
