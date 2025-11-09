/**
 * Chain Example 8: Chain Registry Exploration
 *
 * Demonstrates:
 * - Exploring the chain registry
 * - Grouping chains by characteristics
 * - Finding chains by criteria
 * - Registry statistics and analysis
 */

import { Chain } from '../../../src/primitives/Chain/Chain.js';

console.log('\n=== Chain Registry Exploration Example ===\n');

// Registry statistics
console.log('1. Registry Statistics');
console.log('   -------------------');

function getRegistryStats(): {
  totalChains: number;
  chainIds: number[];
  minChainId: number;
  maxChainId: number;
} {
  const chainIds = Object.keys(Chain.byId).map(Number);

  return {
    totalChains: chainIds.length,
    chainIds,
    minChainId: Math.min(...chainIds),
    maxChainId: Math.max(...chainIds),
  };
}

const stats = getRegistryStats();
console.log(`   Total chains in registry: ${stats.totalChains}`);
console.log(`   Chain ID range: ${stats.minChainId} - ${stats.maxChainId}\n`);

// Group chains by currency
console.log('2. Group Chains by Currency');
console.log('   ------------------------');

function groupByCurrency(): Map<string, number[]> {
  const groups = new Map<string, number[]>();

  Object.values(Chain.byId).forEach((chain) => {
    const symbol = chain.nativeCurrency.symbol;
    const existing = groups.get(symbol) ?? [];
    groups.set(symbol, [...existing, chain.chainId]);
  });

  return groups;
}

const currencyGroups = groupByCurrency();
const topCurrencies = Array.from(currencyGroups.entries())
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10);

console.log('   Top 10 currencies by chain count:\n');
topCurrencies.forEach(([symbol, chainIds], i) => {
  console.log(`   ${(i + 1).toString().padStart(2)}. ${symbol.padEnd(10)} ${chainIds.length} chains`);
});

console.log();

// Find chains by name pattern
console.log('3. Find Chains by Name Pattern');
console.log('   ---------------------------');

function findChainsByName(pattern: string): Array<{ id: number; name: string }> {
  const regex = new RegExp(pattern, 'i');
  const matches: Array<{ id: number; name: string }> = [];

  Object.values(Chain.byId).forEach((chain) => {
    if (regex.test(chain.name)) {
      matches.push({ id: chain.chainId, name: chain.name });
    }
  });

  return matches.sort((a, b) => a.id - b.id);
}

const testnetChains = findChainsByName('testnet');
console.log(`   Chains with "testnet" in name: ${testnetChains.length}`);
if (testnetChains.length > 0) {
  console.log('   First 5:');
  testnetChains.slice(0, 5).forEach((chain) => {
    console.log(`     ${chain.id}: ${chain.name}`);
  });
}

console.log();

const optimismChains = findChainsByName('optimism');
console.log(`   Chains with "optimism" in name: ${optimismChains.length}`);
optimismChains.forEach((chain) => {
  console.log(`     ${chain.id}: ${chain.name}`);
});

console.log();

// Find chains with multiple RPCs
console.log('4. Chains with Multiple RPC Endpoints');
console.log('   ----------------------------------');

function findChainsWithMultipleRpcs(minRpcs: number = 2): Array<{
  id: number;
  name: string;
  rpcCount: number;
}> {
  const matches: Array<{ id: number; name: string; rpcCount: number }> = [];

  Object.values(Chain.byId).forEach((chain) => {
    if (chain.rpc.length >= minRpcs) {
      matches.push({
        id: chain.chainId,
        name: chain.name,
        rpcCount: chain.rpc.length,
      });
    }
  });

  return matches.sort((a, b) => b.rpcCount - a.rpcCount);
}

const multiRpcChains = findChainsWithMultipleRpcs(3);
console.log(`   Chains with 3+ RPC endpoints: ${multiRpcChains.length}`);
console.log('   Top 10 by RPC count:\n');

multiRpcChains.slice(0, 10).forEach((chain, i) => {
  console.log(`   ${(i + 1).toString().padStart(2)}. ${chain.name.padEnd(30)} ${chain.rpcCount} RPCs`);
});

console.log();

// Find chains with explorers
console.log('5. Chain Explorer Coverage');
console.log('   -----------------------');

function analyzeExplorerCoverage(): {
  withExplorer: number;
  withoutExplorer: number;
  percentage: number;
} {
  let withExplorer = 0;
  let withoutExplorer = 0;

  Object.values(Chain.byId).forEach((chain) => {
    if (chain.explorers && chain.explorers.length > 0) {
      withExplorer++;
    } else {
      withoutExplorer++;
    }
  });

  const total = withExplorer + withoutExplorer;
  const percentage = (withExplorer / total) * 100;

  return { withExplorer, withoutExplorer, percentage };
}

const explorerStats = analyzeExplorerCoverage();
console.log(`   Chains with explorer: ${explorerStats.withExplorer}`);
console.log(`   Chains without explorer: ${explorerStats.withoutExplorer}`);
console.log(`   Coverage: ${explorerStats.percentage.toFixed(1)}%\n`);

// Group by chain ID ranges
console.log('6. Chain ID Distribution');
console.log('   ---------------------');

function analyzeChainIdDistribution(): Map<string, number> {
  const ranges = new Map<string, number>();

  Object.values(Chain.byId).forEach((chain) => {
    const id = chain.chainId;
    let range: string;

    if (id < 100) range = '1-99';
    else if (id < 1000) range = '100-999';
    else if (id < 10000) range = '1,000-9,999';
    else if (id < 100000) range = '10,000-99,999';
    else if (id < 1000000) range = '100,000-999,999';
    else range = '1,000,000+';

    ranges.set(range, (ranges.get(range) ?? 0) + 1);
  });

  return ranges;
}

const distribution = analyzeChainIdDistribution();
const orderedRanges = [
  '1-99',
  '100-999',
  '1,000-9,999',
  '10,000-99,999',
  '100,000-999,999',
  '1,000,000+',
];

console.log('   Chain ID ranges:\n');
orderedRanges.forEach((range) => {
  const count = distribution.get(range) ?? 0;
  const bar = '█'.repeat(Math.min(50, Math.floor(count / 10)));
  console.log(`   ${range.padEnd(20)} ${count.toString().padStart(4)} ${bar}`);
});

console.log();

// Custom registry search
console.log('7. Custom Registry Search');
console.log('   ----------------------');

interface SearchCriteria {
  minRpcEndpoints?: number;
  requireExplorer?: boolean;
  symbol?: string;
  namePattern?: string;
}

function searchRegistry(criteria: SearchCriteria): Array<{
  id: number;
  name: string;
  symbol: string;
}> {
  const results: Array<{ id: number; name: string; symbol: string }> = [];

  Object.values(Chain.byId).forEach((chain) => {
    // Check RPC requirement
    if (
      criteria.minRpcEndpoints &&
      chain.rpc.length < criteria.minRpcEndpoints
    ) {
      return;
    }

    // Check explorer requirement
    if (criteria.requireExplorer && !chain.explorers?.[0]) {
      return;
    }

    // Check symbol
    if (criteria.symbol && chain.nativeCurrency.symbol !== criteria.symbol) {
      return;
    }

    // Check name pattern
    if (criteria.namePattern) {
      const regex = new RegExp(criteria.namePattern, 'i');
      if (!regex.test(chain.name)) {
        return;
      }
    }

    results.push({
      id: chain.chainId,
      name: chain.name,
      symbol: chain.nativeCurrency.symbol,
    });
  });

  return results.sort((a, b) => a.id - b.id);
}

const ethMainnets = searchRegistry({
  symbol: 'ETH',
  requireExplorer: true,
  minRpcEndpoints: 1,
  namePattern: 'mainnet',
});

console.log('   ETH mainnets with explorer and RPC:\n');
ethMainnets.slice(0, 5).forEach((chain) => {
  console.log(`   ${chain.id.toString().padStart(6)}: ${chain.name}`);
});

console.log();

// Registry comparison
console.log('8. Registry Quick Reference');
console.log('   ------------------------');

const commonChains = [
  1, // Ethereum
  10, // Optimism
  56, // BSC
  137, // Polygon
  250, // Fantom
  42161, // Arbitrum
  43114, // Avalanche
];

console.log('   Common EVM chains:\n');
console.log('   ID      Name                      Symbol  RPC  Explorer');
console.log('   ' + '-'.repeat(60));

commonChains.forEach((id) => {
  const chain = Chain.byId[id];
  if (chain) {
    const hasExplorer = chain.explorers?.[0] ? '✓' : '✗';
    console.log(
      `   ${id.toString().padStart(6)}  ${chain.name.padEnd(25)} ${chain.nativeCurrency.symbol.padEnd(7)} ${chain.rpc.length.toString().padStart(3)}  ${hasExplorer}`
    );
  }
});

console.log('\n=== Example Complete ===\n');
