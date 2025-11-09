/**
 * Chain Example 4: Network Detection
 *
 * Demonstrates:
 * - Detecting network from chain ID
 * - Identifying mainnet vs testnet
 * - L1 vs L2 detection
 * - Network type classification
 */

import { Chain } from '../../../src/primitives/Chain/Chain.js';

console.log('\n=== Network Detection Example ===\n');

// Network type detection
console.log('1. Network Classification');
console.log('   ----------------------');

type NetworkType = 'mainnet' | 'testnet' | 'devnet' | 'unknown';

function detectNetworkType(chainId: number): NetworkType {
  const chain = Chain.fromId(chainId);
  if (!chain) return 'unknown';

  const name = chain.name.toLowerCase();

  // Testnet detection
  if (
    name.includes('testnet') ||
    name.includes('sepolia') ||
    name.includes('goerli') ||
    name.includes('holesky') ||
    name.includes('rinkeby') ||
    chainId === 11155111 || // Sepolia
    chainId === 17000 // Holesky
  ) {
    return 'testnet';
  }

  // Devnet detection
  if (name.includes('devnet') || name.includes('localhost') || chainId === 1337) {
    return 'devnet';
  }

  // Mainnet
  return 'mainnet';
}

const testChains = [
  1, // Ethereum
  9, // Quai
  14, // Flare
  11155111, // Sepolia
  10, // Optimism
  42161, // Arbitrum
];

testChains.forEach((id) => {
  const chain = Chain.fromId(id);
  const type = detectNetworkType(id);
  if (chain) {
    console.log(`   ${chain.name.padEnd(25)} → ${type}`);
  }
});

console.log();

// L1 vs L2 detection
console.log('2. Layer Detection');
console.log('   ---------------');

type ChainLayer = 'L1' | 'L2' | 'Sidechain' | 'Unknown';

function detectLayer(chainId: number): ChainLayer {
  // Known L1s
  const l1Chains = [1, 9, 14, 1776, 2020];
  if (l1Chains.includes(chainId)) {
    return 'L1';
  }

  // Known L2s (rollups)
  const l2Chains = [10, 42161, 8453, 7777777, 34443, 59144];
  if (l2Chains.includes(chainId)) {
    return 'L2';
  }

  // Known sidechains
  const sidechains = [137, 100, 250];
  if (sidechains.includes(chainId)) {
    return 'Sidechain';
  }

  const chain = Chain.fromId(chainId);
  if (!chain) return 'Unknown';

  const name = chain.name.toLowerCase();

  // Heuristic detection
  if (name.includes('optimism') || name.includes('arbitrum') || name.includes('zk')) {
    return 'L2';
  }

  if (name.includes('polygon') || name.includes('gnosis')) {
    return 'Sidechain';
  }

  return 'Unknown';
}

const layerTestChains = [
  1, // Ethereum (L1)
  10, // Optimism (L2)
  42161, // Arbitrum (L2)
  137, // Polygon (Sidechain)
  9, // Quai (L1)
];

layerTestChains.forEach((id) => {
  const chain = Chain.fromId(id);
  const layer = detectLayer(id);
  if (chain) {
    console.log(`   ${chain.name.padEnd(25)} → ${layer}`);
  }
});

console.log();

// Settlement layer detection
console.log('3. Settlement Layer');
console.log('   ----------------');

function getSettlementLayer(chainId: number): string {
  const layer = detectLayer(chainId);

  if (layer === 'L1') {
    return 'Self-settled';
  }

  // L2s settle to Ethereum mainnet
  if (layer === 'L2') {
    return 'Ethereum (Chain ID: 1)';
  }

  // Sidechains have bridges
  if (layer === 'Sidechain') {
    return 'Bridge to Ethereum';
  }

  return 'Unknown';
}

layerTestChains.forEach((id) => {
  const chain = Chain.fromId(id);
  const settlement = getSettlementLayer(id);
  if (chain) {
    console.log(`   ${chain.name.padEnd(25)} → ${settlement}`);
  }
});

console.log();

// Network characteristics
console.log('4. Network Characteristics');
console.log('   -----------------------');

interface NetworkCharacteristics {
  chainId: number;
  name: string;
  type: NetworkType;
  layer: ChainLayer;
  symbol: string;
  hasTestFaucet: boolean;
  hasValue: boolean;
}

function analyzeNetwork(chainId: number): NetworkCharacteristics | null {
  const chain = Chain.fromId(chainId);
  if (!chain) return null;

  const type = detectNetworkType(chainId);
  const layer = detectLayer(chainId);

  return {
    chainId: chain.chainId,
    name: chain.name,
    type,
    layer,
    symbol: chain.nativeCurrency.symbol,
    hasTestFaucet: type === 'testnet',
    hasValue: type === 'mainnet',
  };
}

const analyzeChains = [1, 11155111, 10, 42161, 137];
analyzeChains.forEach((id) => {
  const analysis = analyzeNetwork(id);
  if (analysis) {
    console.log(`   ${analysis.name}:`);
    console.log(`     Type: ${analysis.type}`);
    console.log(`     Layer: ${analysis.layer}`);
    console.log(`     Symbol: ${analysis.symbol}`);
    console.log(`     Has faucet: ${analysis.hasTestFaucet ? 'Yes' : 'No'}`);
    console.log(`     Real value: ${analysis.hasValue ? 'Yes' : 'No'}`);
  }
});

console.log();

// Chain family detection
console.log('5. Chain Family Detection');
console.log('   ----------------------');

type ChainFamily = 'Ethereum' | 'Optimism' | 'Arbitrum' | 'Other';

function detectChainFamily(chainId: number): ChainFamily {
  const chain = Chain.fromId(chainId);
  if (!chain) return 'Other';

  const name = chain.name.toLowerCase();

  if (name.includes('optimism') || name.includes('base') || chainId === 10 || chainId === 8453) {
    return 'Optimism';
  }

  if (name.includes('arbitrum') || chainId === 42161 || chainId === 42170) {
    return 'Arbitrum';
  }

  if (chainId === 1 || name.includes('ethereum')) {
    return 'Ethereum';
  }

  return 'Other';
}

const familyChains = [1, 10, 8453, 42161, 9, 14];
familyChains.forEach((id) => {
  const chain = Chain.fromId(id);
  const family = detectChainFamily(id);
  if (chain) {
    console.log(`   ${chain.name.padEnd(25)} → ${family}`);
  }
});

console.log();

// User-facing network selector
console.log('6. Network Selector Helper');
console.log('   -----------------------');

interface NetworkOption {
  chainId: number;
  label: string;
  description: string;
  icon?: string;
}

function getNetworkOptions(): NetworkOption[] {
  const mainChains = [1, 10, 42161, 8453, 137];

  return mainChains
    .map((id) => {
      const chain = Chain.fromId(id);
      const layer = detectLayer(id);
      if (!chain) return null;

      return {
        chainId: chain.chainId,
        label: chain.name,
        description: `${layer} • ${chain.nativeCurrency.symbol}`,
      };
    })
    .filter((opt): opt is NetworkOption => opt !== null);
}

const options = getNetworkOptions();
console.log('   Available networks for user:\n');
options.forEach((opt) => {
  console.log(`   [${opt.chainId}] ${opt.label}`);
  console.log(`       ${opt.description}\n`);
});

console.log('=== Example Complete ===\n');
