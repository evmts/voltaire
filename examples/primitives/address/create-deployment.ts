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

const deployer = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Calculate contract address for nonce 0 (first deployment)
const contract0 = deployer.calculateCreateAddress(0n);

// Calculate contract address for nonce 1 (second deployment)
const contract1 = deployer.calculateCreateAddress(1n);

// Before deploying, predict where contracts will be deployed
const currentNonce = 5n;
for (let i = 0n; i < 5n; i++) {
	const nonce = currentNonce + i;
	const predicted = deployer.calculateCreateAddress(nonce);
}

class ContractFactory {
	private deployerAddr: Address;
	private currentNonce: bigint;

	constructor(deployer: Address, startNonce = 0n) {
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
const preview = factory.previewDeployments(3);
preview.forEach((addr, i) => {});

// Deploy contracts one by one
const token = factory.deploy("Token Contract");
const marketplace = factory.deploy("Marketplace Contract");
const governance = factory.deploy("Governance Contract");

// Scenario: Deploy contracts that need to know each other's addresses
const deployer2 = Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
let nonce = 100n;

// Calculate all addresses before deployment
const proxy = deployer2.calculateCreateAddress(nonce++);
const implementation = deployer2.calculateCreateAddress(nonce++);
const registry = deployer2.calculateCreateAddress(nonce++);

// Large nonce
const largeNonce = 999999n;
const largeNonceAddr = deployer.calculateCreateAddress(largeNonce);

// Zero nonce (first deployment from new account)
const zeroNonceAddr = deployer.calculateCreateAddress(0n);

// Negative nonce (will throw error)
try {
	deployer.calculateCreateAddress(-1n);
} catch (e) {}
