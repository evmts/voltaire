/**
 * Chain Example 2: Network Metadata
 *
 * Demonstrates:
 * - Accessing chain properties (RPC, explorer, currency)
 * - Working with native currency details
 * - Generating explorer links
 * - Using RPC endpoints with fallbacks
 */

import { Chain } from '../../../src/primitives/Chain/Chain.js';

console.log('\n=== Network Metadata Example ===\n');

// Display comprehensive chain information
console.log('1. Complete Chain Information');
console.log('   --------------------------');

const quai = Chain.fromId(9);
if (quai) {
  console.log(`   Name: ${quai.name}`);
  console.log(`   Chain ID: ${quai.chainId}`);
  console.log(`   Network ID: ${quai.networkId ?? 'N/A'}`);
  console.log(`   Short Name: ${quai.shortName}`);
  console.log(`   Chain: ${quai.chain}`);
  console.log('\n   Native Currency:');
  console.log(`     Name: ${quai.nativeCurrency.name}`);
  console.log(`     Symbol: ${quai.nativeCurrency.symbol}`);
  console.log(`     Decimals: ${quai.nativeCurrency.decimals}`);
  console.log(`\n   RPC Endpoints: ${quai.rpc.length} available`);
  quai.rpc.forEach((rpc, i) => {
    console.log(`     [${i}] ${rpc}`);
  });
  if (quai.explorers && quai.explorers.length > 0) {
    console.log(`\n   Block Explorers:`);
    quai.explorers.forEach((explorer) => {
      console.log(`     ${explorer.name}: ${explorer.url}`);
      if (explorer.standard) {
        console.log(`       Standard: ${explorer.standard}`);
      }
    });
  }
  if (quai.infoURL) {
    console.log(`\n   Info URL: ${quai.infoURL}`);
  }
  console.log();
}

// RPC endpoint management
console.log('2. RPC Connection Helper');
console.log('   ---------------------');

function getRpcWithFallback(chainId: number): string | null {
  const chain = Chain.fromId(chainId);
  if (!chain || chain.rpc.length === 0) {
    return null;
  }
  // Return first available RPC
  return chain.rpc[0];
}

function getAllRpcEndpoints(chainId: number): string[] {
  const chain = Chain.fromId(chainId);
  return chain?.rpc ?? [];
}

const flareRpc = getRpcWithFallback(14);
console.log(`   Flare primary RPC: ${flareRpc ?? 'None'}`);

const allFlareRpcs = getAllRpcEndpoints(14);
console.log(`   Flare has ${allFlareRpcs.length} RPC endpoints\n`);

// Explorer link generation
console.log('3. Explorer Link Generator');
console.log('   -----------------------');

type LinkType = 'tx' | 'address' | 'block';

function generateExplorerLink(
  chainId: number,
  type: LinkType,
  value: string
): string | null {
  const chain = Chain.fromId(chainId);
  const explorer = chain?.explorers?.[0];

  if (!explorer) {
    return null;
  }

  return `${explorer.url}/${type}/${value}`;
}

const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e';
const blockNumber = '12345678';

const quaiTxLink = generateExplorerLink(9, 'tx', txHash);
const quaiAddressLink = generateExplorerLink(9, 'address', address);
const quaiBlockLink = generateExplorerLink(9, 'block', blockNumber);

console.log(`   Transaction: ${quaiTxLink ?? 'No explorer'}`);
console.log(`   Address: ${quaiAddressLink ?? 'No explorer'}`);
console.log(`   Block: ${quaiBlockLink ?? 'No explorer'}\n`);

// Currency formatting helper
console.log('4. Native Currency Formatting');
console.log('   --------------------------');

function formatNativeAmount(chainId: number, weiAmount: bigint): string | null {
  const chain = Chain.fromId(chainId);
  if (!chain) return null;

  const decimals = chain.nativeCurrency.decimals;
  const symbol = chain.nativeCurrency.symbol;

  // Convert wei to token amount
  const divisor = 10n ** BigInt(decimals);
  const tokenAmount = Number(weiAmount) / Number(divisor);

  return `${tokenAmount.toFixed(6)} ${symbol}`;
}

const amount1 = 1500000000000000000n; // 1.5 in wei (18 decimals)
const amount2 = 5000000000000000000n; // 5 in wei

const quaiFormatted = formatNativeAmount(9, amount1);
const flareFormatted = formatNativeAmount(14, amount2);

console.log(`   Quai: ${quaiFormatted ?? 'N/A'}`);
console.log(`   Flare: ${flareFormatted ?? 'N/A'}\n`);

// Multi-network comparison
console.log('5. Multi-Network Summary');
console.log('   ---------------------');

interface ChainSummary {
  id: number;
  name: string;
  symbol: string;
  rpcCount: number;
  hasExplorer: boolean;
}

function summarizeChain(chainId: number): ChainSummary | null {
  const chain = Chain.fromId(chainId);
  if (!chain) return null;

  return {
    id: chain.chainId,
    name: chain.name,
    symbol: chain.nativeCurrency.symbol,
    rpcCount: chain.rpc.length,
    hasExplorer: !!chain.explorers?.[0],
  };
}

const chainIds = [9, 14, 1776, 2020, 2288];
const summaries = chainIds
  .map(summarizeChain)
  .filter((s): s is ChainSummary => s !== null);

summaries.forEach((summary) => {
  console.log(`   ${summary.name}:`);
  console.log(`     ID: ${summary.id}`);
  console.log(`     Symbol: ${summary.symbol}`);
  console.log(`     RPC endpoints: ${summary.rpcCount}`);
  console.log(`     Has explorer: ${summary.hasExplorer ? 'Yes' : 'No'}`);
});

console.log('\n=== Example Complete ===\n');
