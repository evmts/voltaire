/**
 * CREATE Contract Deployment Address Example
 *
 * Demonstrates:
 * - Calculating CREATE contract addresses (nonce-based)
 * - Predicting deployment addresses before deployment
 * - Understanding nonce-based determinism
 * - Multi-contract deployment scenarios
 */

import { Address } from "../../../src/primitives/Address/index.js";

console.log("=== CREATE Contract Deployment ===\n");

// 1. Basic CREATE address calculation
console.log("1. Basic CREATE Address Calculation\n");

const deployer = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
console.log(`Deployer address: ${deployer.toChecksummed()}`);
console.log();

// Calculate contract address for nonce 0 (first deployment)
const contract0 = deployer.calculateCreateAddress(0n);
console.log(`Contract at nonce 0: ${contract0.toChecksummed()}`);

// Calculate contract address for nonce 1 (second deployment)
const contract1 = deployer.calculateCreateAddress(1n);
console.log(`Contract at nonce 1: ${contract1.toChecksummed()}`);

// Each nonce produces a different address
console.log(`\nAddresses are different: ${!contract0.equals(contract1)}`);
console.log();

// 2. Predicting deployment addresses
console.log("2. Predicting Deployment Addresses\n");

// Before deploying, predict where contracts will be deployed
const currentNonce = 5n;
console.log(`Current account nonce: ${currentNonce}\n`);

console.log("Next 5 deployment addresses:");
for (let i = 0n; i < 5n; i++) {
	const nonce = currentNonce + i;
	const predicted = deployer.calculateCreateAddress(nonce);
	console.log(`Nonce ${nonce}: ${predicted.toChecksummed()}`);
}
console.log();

// 3. Multi-contract factory deployment
console.log("3. Multi-Contract Factory Deployment\n");

class ContractFactory {
	private deployerAddr: Address;
	private currentNonce: bigint;

	constructor(deployer: Address, startNonce: bigint = 0n) {
		this.deployerAddr = deployer;
		this.currentNonce = startNonce;
	}

	// Predict next contract address without deploying
	predictNextAddress(): Address {
		return this.deployerAddr.calculateCreateAddress(this.currentNonce);
	}

	// Simulate deployment (increments nonce)
	deploy(name: string): Address {
		const contractAddr = this.predictNextAddress();
		console.log(`Deploying ${name}...`);
		console.log(`  Nonce: ${this.currentNonce}`);
		console.log(`  Address: ${contractAddr.toChecksummed()}`);
		this.currentNonce++;
		return contractAddr;
	}

	// Get addresses for next N deployments
	previewDeployments(count: number): Address[] {
		const addresses: Address[] = [];
		for (let i = 0; i < count; i++) {
			const addr = this.deployerAddr.calculateCreateAddress(
				this.currentNonce + BigInt(i),
			);
			addresses.push(addr);
		}
		return addresses;
	}
}

const factory = new ContractFactory(deployer, 10n);

// Preview addresses before deploying
console.log("Preview next 3 deployments:");
const preview = factory.previewDeployments(3);
preview.forEach((addr, i) => {
	console.log(`  ${i + 1}. ${addr.toChecksummed()}`);
});
console.log();

// Deploy contracts one by one
const token = factory.deploy("Token Contract");
const marketplace = factory.deploy("Marketplace Contract");
const governance = factory.deploy("Governance Contract");
console.log();

// 4. Real-world scenario: Linked contracts
console.log("4. Linked Contract Deployment\n");

// Scenario: Deploy contracts that need to know each other's addresses
const deployer2 = Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
let nonce = 100n;

console.log(`Deployer: ${deployer2.toChecksummed()}`);
console.log(`Starting nonce: ${nonce}\n`);

// Calculate all addresses before deployment
const proxy = deployer2.calculateCreateAddress(nonce++);
const implementation = deployer2.calculateCreateAddress(nonce++);
const registry = deployer2.calculateCreateAddress(nonce++);

console.log("Pre-calculated addresses:");
console.log(`1. Proxy:          ${proxy.toChecksummed()}`);
console.log(`2. Implementation: ${implementation.toChecksummed()}`);
console.log(`3. Registry:       ${registry.toChecksummed()}`);
console.log();
console.log("These addresses can be used in contract constructors!");
console.log();

// 5. Understanding CREATE formula
console.log("5. Understanding CREATE Formula\n");

console.log("CREATE address = keccak256(rlp([sender, nonce]))[12:32]");
console.log();
console.log("Key points:");
console.log("- Address depends on sender address and nonce");
console.log("- Nonce increments with each transaction");
console.log("- Deterministic: same sender + nonce = same address");
console.log("- Different from CREATE2 (which uses salt + init code)");
console.log();

// 6. Edge cases
console.log("6. Edge Cases\n");

// Large nonce
const largeNonce = 999999n;
const largeNonceAddr = deployer.calculateCreateAddress(largeNonce);
console.log(`Large nonce (${largeNonce}): ${largeNonceAddr.toChecksummed()}`);

// Zero nonce (first deployment from new account)
const zeroNonceAddr = deployer.calculateCreateAddress(0n);
console.log(`Zero nonce: ${zeroNonceAddr.toChecksummed()}`);

// Negative nonce (will throw error)
try {
	deployer.calculateCreateAddress(-1n);
	console.log("ERROR: Should have thrown!");
} catch (e) {
	console.log(`Negative nonce rejected: ${(e as Error).message}`);
}
