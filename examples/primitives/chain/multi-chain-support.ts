/**
 * Chain Example 3: Multi-Chain Support
 *
 * Demonstrates:
 * - Building multi-chain applications
 * - Chain validation and filtering
 * - Creating chain configuration registries
 * - Network switching logic
 */

import { Chain } from '../../../src/primitives/Chain/Chain.js';

console.log('\n=== Multi-Chain Support Example ===\n');

// Define supported chains for your application
console.log('1. Application Chain Registry');
console.log('   --------------------------');

const SUPPORTED_CHAIN_IDS = [1, 10, 42161, 8453, 137] as const;

type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

// Validate if chain is supported
function isChainSupported(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

// Get all supported chains
function getSupportedChains() {
  return SUPPORTED_CHAIN_IDS.map((id) => Chain.fromId(id)).filter(
    (chain): chain is NonNullable<typeof chain> => chain !== undefined
  );
}

const supportedChains = getSupportedChains();
console.log(`   Application supports ${supportedChains.length} chains:\n`);

supportedChains.forEach((chain) => {
  console.log(`   - ${chain.name} (ID: ${chain.chainId})`);
});

console.log(`\n   Chain 9 supported: ${isChainSupported(9)}`);
console.log(`   Chain 1 supported: ${isChainSupported(1)}\n`);

// Chain configuration with app-specific settings
console.log('2. Chain-Specific Configuration');
console.log('   ----------------------------');

interface ChainConfig {
  chainId: number;
  enabled: boolean;
  rpcUrl?: string;
  maxGasPrice?: bigint;
  confirmations: number;
}

const chainConfigs: Record<number, ChainConfig> = {
  1: {
    chainId: 1,
    enabled: true,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    maxGasPrice: 100_000_000_000n, // 100 gwei
    confirmations: 12,
  },
  10: {
    chainId: 10,
    enabled: true,
    confirmations: 1,
  },
  42161: {
    chainId: 42161,
    enabled: true,
    confirmations: 1,
  },
  8453: {
    chainId: 8453,
    enabled: false, // Temporarily disabled
    confirmations: 1,
  },
};

// Get chain config with defaults from Chain metadata
function getChainConfig(chainId: number): (ChainConfig & { name: string }) | null {
  const config = chainConfigs[chainId];
  const chain = Chain.fromId(chainId);

  if (!config || !chain) {
    return null;
  }

  return {
    ...config,
    name: chain.name,
    rpcUrl: config.rpcUrl ?? chain.rpc[0],
  };
}

Object.keys(chainConfigs).forEach((id) => {
  const config = getChainConfig(Number(id));
  if (config) {
    console.log(`   ${config.name}:`);
    console.log(`     Enabled: ${config.enabled}`);
    console.log(`     Confirmations: ${config.confirmations}`);
    if (config.maxGasPrice) {
      console.log(`     Max Gas: ${config.maxGasPrice} wei`);
    }
  }
});

console.log();

// Network switching handler
console.log('3. Network Switching');
console.log('   -----------------');

let currentChainId: number | null = null;

function switchNetwork(newChainId: number): boolean {
  if (!isChainSupported(newChainId)) {
    console.log(`   ✗ Chain ${newChainId} not supported`);
    return false;
  }

  const config = getChainConfig(newChainId);
  if (!config || !config.enabled) {
    console.log(`   ✗ Chain ${newChainId} is disabled`);
    return false;
  }

  const chain = Chain.fromId(newChainId);
  if (!chain) {
    console.log(`   ✗ Chain ${newChainId} not found`);
    return false;
  }

  console.log(`   ✓ Switching to ${chain.name}...`);
  console.log(`     Chain ID: ${chain.chainId}`);
  console.log(`     RPC: ${config.rpcUrl}`);
  console.log(`     Symbol: ${chain.nativeCurrency.symbol}`);

  currentChainId = newChainId;
  return true;
}

switchNetwork(1);
console.log();
switchNetwork(8453); // Disabled
console.log();
switchNetwork(999); // Not supported
console.log();

// Chain comparison utility
console.log('4. Chain Comparison');
console.log('   ----------------');

function compareChains(chainId1: number, chainId2: number): void {
  const chain1 = Chain.fromId(chainId1);
  const chain2 = Chain.fromId(chainId2);

  if (!chain1 || !chain2) {
    console.log('   One or both chains not found');
    return;
  }

  console.log(`   ${chain1.name} vs ${chain2.name}:`);
  console.log(
    `     Same currency: ${chain1.nativeCurrency.symbol === chain2.nativeCurrency.symbol}`
  );
  console.log(
    `     Same decimals: ${chain1.nativeCurrency.decimals === chain2.nativeCurrency.decimals}`
  );
  console.log(`     RPC endpoints: ${chain1.rpc.length} vs ${chain2.rpc.length}`);
  console.log(
    `     Has explorer: ${!!chain1.explorers?.[0]} vs ${!!chain2.explorers?.[0]}`
  );
}

compareChains(1, 10);
console.log();
compareChains(9, 14);
console.log();

// Filter chains by criteria
console.log('5. Chain Filtering');
console.log('   ---------------');

// Get all chains with ETH as native currency
function getChainsWithSymbol(symbol: string): number[] {
  const chainIds: number[] = [];

  // Check supported chains
  for (const id of SUPPORTED_CHAIN_IDS) {
    const chain = Chain.fromId(id);
    if (chain?.nativeCurrency.symbol === symbol) {
      chainIds.push(id);
    }
  }

  return chainIds;
}

const ethChains = getChainsWithSymbol('ETH');
console.log(`   Chains using ETH:`);
ethChains.forEach((id) => {
  const chain = Chain.fromId(id);
  if (chain) {
    console.log(`     - ${chain.name} (${id})`);
  }
});

console.log();

// Chain availability checker
console.log('6. Chain Availability Check');
console.log('   ------------------------');

interface ChainStatus {
  chainId: number;
  name: string;
  hasRpc: boolean;
  hasExplorer: boolean;
  supported: boolean;
}

function checkChainStatus(chainId: number): ChainStatus | null {
  const chain = Chain.fromId(chainId);
  if (!chain) return null;

  return {
    chainId: chain.chainId,
    name: chain.name,
    hasRpc: chain.rpc.length > 0,
    hasExplorer: !!chain.explorers?.[0],
    supported: isChainSupported(chainId),
  };
}

const checkChains = [1, 9, 10, 42161];
checkChains.forEach((id) => {
  const status = checkChainStatus(id);
  if (status) {
    console.log(`   ${status.name}:`);
    console.log(`     Has RPC: ${status.hasRpc ? '✓' : '✗'}`);
    console.log(`     Has Explorer: ${status.hasExplorer ? '✓' : '✗'}`);
    console.log(`     Supported: ${status.supported ? '✓' : '✗'}`);
  }
});

console.log('\n=== Example Complete ===\n');
