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

import { Address } from '../../../src/primitives/Address/index.js';
import { Bytes } from '../../../src/primitives/Bytes/index.js';

console.log('=== CREATE2 Contract Deployment ===\n');

// 1. Basic CREATE2 address calculation
console.log('1. Basic CREATE2 Address Calculation\n');

const deployer = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
console.log(`Deployer (factory): ${deployer.toChecksummed()}`);

// Contract initialization code (bytecode)
const initCode = Bytes.fromHex("0x608060405234801561001057600080fd5b50");
console.log(`Init code: ${Bytes.toHex(initCode)}`);
console.log();

// Calculate with different salts
const salt1 = 0n;
const salt2 = 42n;
const salt3 = 0xcafebaben;

const contract1 = deployer.calculateCreate2Address(salt1, initCode);
const contract2 = deployer.calculateCreate2Address(salt2, initCode);
const contract3 = deployer.calculateCreate2Address(salt3, initCode);

console.log(`Salt ${salt1}: ${contract1.toChecksummed()}`);
console.log(`Salt ${salt2}: ${contract2.toChecksummed()}`);
console.log(`Salt 0xcafebabe: ${contract3.toChecksummed()}`);
console.log();

// 2. Deterministic deployment
console.log('2. Deterministic Deployment\n');

// Same inputs always produce same address
const addr1 = deployer.calculateCreate2Address(42n, initCode);
const addr2 = deployer.calculateCreate2Address(42n, initCode);

console.log('Same salt, same init code:');
console.log(`First call:  ${addr1.toChecksummed()}`);
console.log(`Second call: ${addr2.toChecksummed()}`);
console.log(`Are equal: ${addr1.equals(addr2)}`);
console.log();

// Different init code = different address
const initCode2 = Bytes.fromHex("0x608060405234801561001057600080fd5b51");
const differentAddr = deployer.calculateCreate2Address(42n, initCode2);
console.log('Same salt, different init code:');
console.log(`Original: ${addr1.toChecksummed()}`);
console.log(`Modified: ${differentAddr.toChecksummed()}`);
console.log(`Are equal: ${addr1.equals(differentAddr)}`);
console.log();

// 3. CREATE2 Factory pattern
console.log('3. CREATE2 Factory Pattern\n');

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
  findSalt(targetAddr: Address, initCode: Uint8Array, maxAttempts = 1000000): bigint | null {
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

console.log('Batch address prediction:');
predicted.forEach((addr, salt) => {
  console.log(`  Salt ${salt}: ${addr.toChecksummed()}`);
});
console.log();

// 4. Vanity address mining
console.log('4. Vanity Address Mining\n');

function mineVanityAddress(
  factory: Address,
  initCode: Uint8Array,
  prefix: Uint8Array,
  maxAttempts = 100000
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

// Find address starting with 0x0000
console.log('Mining for address starting with 0x0000...');
const prefix = new Uint8Array([0x00, 0x00]);
const result = mineVanityAddress(deployer, initCode, prefix);

if (result) {
  console.log(`✓ Found!`);
  console.log(`  Address: ${result.address.toChecksummed()}`);
  console.log(`  Salt: ${result.salt}`);
} else {
  console.log('✗ Not found in search space');
}
console.log();

// 5. Cross-chain deployment
console.log('5. Cross-Chain Deployment Consistency\n');

// Same factory + salt + init code = same address on all chains
const chainDeployers = new Map([
  ['Ethereum', Address.fromHex("0x4e59b44847b379578588920cA78FbF26c0B4956C")],
  ['Optimism', Address.fromHex("0x4e59b44847b379578588920cA78FbF26c0B4956C")],
  ['Arbitrum', Address.fromHex("0x4e59b44847b379578588920cA78FbF26c0B4956C")],
]);

const crossChainSalt = 12345n;
const crossChainInit = Bytes.fromHex("0x608060405234801561001057600080fd5b50");

console.log('Same address across chains:');
chainDeployers.forEach((factoryAddr, chain) => {
  const addr = factoryAddr.calculateCreate2Address(crossChainSalt, crossChainInit);
  console.log(`  ${chain}: ${addr.toChecksummed()}`);
});
console.log();

// 6. Salt types
console.log('6. Salt Types\n');

// Salt as bigint
const saltBigInt = 42n;
const addrFromBigInt = deployer.calculateCreate2Address(saltBigInt, initCode);
console.log(`Salt as bigint (42n): ${addrFromBigInt.toChecksummed()}`);

// Salt as Uint8Array (must be 32 bytes)
const saltBytes = new Uint8Array(32);
saltBytes[31] = 42; // Last byte = 42
const addrFromBytes = deployer.calculateCreate2Address(saltBytes, initCode);
console.log(`Salt as bytes [32]: ${addrFromBytes.toChecksummed()}`);

// Should be equal (42n = 0x000...02a)
console.log(`Are equal: ${addrFromBigInt.equals(addrFromBytes)}`);
console.log();

// 7. Understanding CREATE2 formula
console.log('7. Understanding CREATE2 Formula\n');

console.log('CREATE2 address = keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))[12:32]');
console.log();
console.log('Key points:');
console.log('- Address depends on factory, salt, and init code hash');
console.log('- Fully deterministic (no nonce)');
console.log('- Same inputs always produce same address');
console.log('- Useful for counterfactual contracts');
console.log('- Enables cross-chain address consistency');
console.log();

// 8. Error handling
console.log('8. Error Handling\n');

// Wrong salt size (Uint8Array)
try {
  const wrongSalt = new Uint8Array(16); // Must be 32 bytes
  deployer.calculateCreate2Address(wrongSalt, initCode);
  console.log('ERROR: Should have thrown!');
} catch (e) {
  console.log(`✓ Wrong salt size rejected: ${(e as Error).message}`);
}

// Negative salt (bigint)
try {
  deployer.calculateCreate2Address(-1n, initCode);
  console.log('ERROR: Should have thrown!');
} catch (e) {
  console.log(`✓ Negative salt rejected: ${(e as Error).message}`);
}
