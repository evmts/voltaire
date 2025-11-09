/**
 * Example 5: USD Price Conversions
 *
 * Demonstrates:
 * - Converting Wei/Gwei/Ether to USD
 * - Price impact calculations
 * - Gas cost in fiat currency
 * - Budget planning and cost analysis
 */

import * as Wei from '../../../src/primitives/Denomination/Wei.js';
import * as Gwei from '../../../src/primitives/Denomination/Gwei.js';
import * as Ether from '../../../src/primitives/Denomination/Ether.js';
import * as Uint from '../../../src/primitives/Uint/index.js';

console.log('\n=== USD Price Conversions ===\n');

// Example 1: Wei to USD conversion
console.log('1. Converting Wei to USD\n');
console.log('   ----------------------');

function weiToUSD(wei: Wei.Type, ethPriceUsd: number): number {
  const weiU256 = Wei.toU256(wei);
  const weiPerEther = Uint.from(1_000_000_000_000_000_000n);

  // Convert to Ether as decimal number
  const ether = Number(Uint.dividedBy(weiU256, weiPerEther));
  const fractionalWei = Number(Uint.modulo(weiU256, weiPerEther));
  const fractionalEther = fractionalWei / Number(weiPerEther);

  const totalEther = ether + fractionalEther;
  return totalEther * ethPriceUsd;
}

const ethPrice = 2000; // $2000 per ETH
const balances = [
  Wei.from(1_000_000_000_000_000_000n), // 1 ETH
  Wei.from(500_000_000_000_000_000n),   // 0.5 ETH
  Wei.from(100_000_000_000_000_000n),   // 0.1 ETH
  Wei.from(1_000_000_000_000_000n),     // 0.001 ETH
];

console.log(`   ETH Price: $${ethPrice}`);
for (const balance of balances) {
  const usd = weiToUSD(balance, ethPrice);
  const eth = Number(Wei.toU256(balance)) / 1e18;
  console.log(`   ${eth.toFixed(6)} ETH = $${usd.toFixed(2)} USD`);
}

console.log('');

// Example 2: Gas cost in USD
console.log('2. Gas Cost in USD\n');
console.log('   ----------------');

function gasCostUSD(
  gasPriceGwei: Gwei.Type,
  gasUsed: bigint,
  ethPriceUsd: number
): number {
  const gasPriceWei = Gwei.toWei(gasPriceGwei);
  const costWei = Uint.times(gasPriceWei, Uint.from(gasUsed));

  return weiToUSD(Wei.from(costWei), ethPriceUsd);
}

const operations = [
  { name: 'Transfer', gas: 21_000n },
  { name: 'ERC-20 Transfer', gas: 65_000n },
  { name: 'Uniswap Swap', gas: 150_000n },
  { name: 'NFT Mint', gas: 100_000n },
];

const gasPrices = [
  { name: 'Slow', gwei: 20n },
  { name: 'Standard', gwei: 50n },
  { name: 'Fast', gwei: 100n },
];

for (const op of operations) {
  console.log(`   ${op.name} (${op.gas} gas):`);
  for (const price of gasPrices) {
    const cost = gasCostUSD(Gwei.from(price.gwei), op.gas, ethPrice);
    console.log(`     ${price.name} (${price.gwei} Gwei): $${cost.toFixed(2)}`);
  }
}

console.log('');

// Example 3: Price sensitivity analysis
console.log('3. Price Sensitivity Analysis\n');
console.log('   ---------------------------');

function costAtDifferentPrices(
  wei: Wei.Type,
  ethPrices: number[]
): Map<number, number> {
  const costs = new Map<number, number>();

  for (const price of ethPrices) {
    costs.set(price, weiToUSD(wei, price));
  }

  return costs;
}

const txCost = Wei.from(1_050_000_000_000_000n); // 0.00105 ETH (21k @ 50 Gwei)
const ethPriceRange = [1000, 1500, 2000, 2500, 3000, 4000, 5000];

console.log('   Transaction cost (0.00105 ETH) at different ETH prices:');
const costs = costAtDifferentPrices(txCost, ethPriceRange);

for (const [ethPrice, usdCost] of costs) {
  console.log(`     ETH = $${ethPrice}: $${usdCost.toFixed(2)}`);
}

console.log('');

// Example 4: Monthly gas budget
console.log('4. Monthly Gas Budget Analysis\n');
console.log('   ----------------------------');

interface MonthlyUsage {
  transfers: number;
  tokenTransfers: number;
  swaps: number;
}

function calculateMonthlyGasCost(
  usage: MonthlyUsage,
  avgGasPrice: Gwei.Type,
  ethPriceUsd: number
): { total: number; breakdown: Record<string, number> } {
  const transferCost = gasCostUSD(avgGasPrice, 21_000n, ethPriceUsd) * usage.transfers;
  const tokenCost = gasCostUSD(avgGasPrice, 65_000n, ethPriceUsd) * usage.tokenTransfers;
  const swapCost = gasCostUSD(avgGasPrice, 150_000n, ethPriceUsd) * usage.swaps;

  return {
    total: transferCost + tokenCost + swapCost,
    breakdown: {
      transfers: transferCost,
      tokenTransfers: tokenCost,
      swaps: swapCost,
    },
  };
}

const monthlyUsage: MonthlyUsage = {
  transfers: 10,         // 10 ETH transfers
  tokenTransfers: 20,    // 20 token transfers
  swaps: 5,              // 5 DEX swaps
};

const avgGasPrice = Gwei.from(50n);
const monthlyCost = calculateMonthlyGasCost(monthlyUsage, avgGasPrice, ethPrice);

console.log(`   ETH Price: $${ethPrice}`);
console.log(`   Avg Gas Price: ${avgGasPrice} Gwei`);
console.log('');
console.log('   Monthly Activity:');
console.log(`     ${monthlyUsage.transfers} transfers: $${monthlyCost.breakdown.transfers.toFixed(2)}`);
console.log(`     ${monthlyUsage.tokenTransfers} token transfers: $${monthlyCost.breakdown.tokenTransfers.toFixed(2)}`);
console.log(`     ${monthlyUsage.swaps} swaps: $${monthlyCost.breakdown.swaps.toFixed(2)}`);
console.log(`   Total Monthly Cost: $${monthlyCost.total.toFixed(2)}`);

console.log('');

// Example 5: ROI calculation
console.log('5. Transaction ROI Analysis\n');
console.log('   -------------------------');

function calculateROI(
  gasCostWei: Wei.Type,
  profitWei: Wei.Type,
  ethPriceUsd: number
): { gasCostUsd: number; profitUsd: number; netProfitUsd: number; roi: number } {
  const gasCostUsd = weiToUSD(gasCostWei, ethPriceUsd);
  const profitUsd = weiToUSD(profitWei, ethPriceUsd);
  const netProfitUsd = profitUsd - gasCostUsd;
  const roi = gasCostUsd > 0 ? (netProfitUsd / gasCostUsd) * 100 : 0;

  return { gasCostUsd, profitUsd, netProfitUsd, roi };
}

const scenarios = [
  {
    name: 'Arbitrage opportunity',
    gasPrice: 100n,
    gasUsed: 300_000n,
    profit: Wei.from(100_000_000_000_000_000n), // 0.1 ETH
  },
  {
    name: 'Small trade',
    gasPrice: 50n,
    gasUsed: 150_000n,
    profit: Wei.from(10_000_000_000_000_000n), // 0.01 ETH
  },
];

for (const scenario of scenarios) {
  const gasPriceGwei = Gwei.from(scenario.gasPrice);
  const gasPriceWei = Gwei.toWei(gasPriceGwei);
  const gasCost = Wei.from(Uint.times(gasPriceWei, Uint.from(scenario.gasUsed)));

  const analysis = calculateROI(gasCost, scenario.profit, ethPrice);

  console.log(`   ${scenario.name}:`);
  console.log(`     Gas cost: $${analysis.gasCostUsd.toFixed(2)}`);
  console.log(`     Expected profit: $${analysis.profitUsd.toFixed(2)}`);
  console.log(`     Net profit: $${analysis.netProfitUsd.toFixed(2)}`);
  console.log(`     ROI: ${analysis.roi.toFixed(1)}%`);
  console.log(`     Worth it: ${analysis.netProfitUsd > 0 ? '✓' : '✗'}`);
}

console.log('');

// Example 6: Cost comparison matrix
console.log('6. Gas Cost Matrix (USD)\n');
console.log('   ---------------------');

console.log('   Gas Price | 21k Transfer | 65k Token | 150k Swap');
console.log('   ----------|--------------|-----------|----------');

for (const price of gasPrices) {
  const transfer = gasCostUSD(Gwei.from(price.gwei), 21_000n, ethPrice);
  const token = gasCostUSD(Gwei.from(price.gwei), 65_000n, ethPrice);
  const swap = gasCostUSD(Gwei.from(price.gwei), 150_000n, ethPrice);

  console.log(
    `   ${price.gwei.toString().padEnd(9)} | $${transfer.toFixed(2).padEnd(12)} | $${token.toFixed(2).padEnd(9)} | $${swap.toFixed(2)}`
  );
}

console.log('\n=== Example Complete ===\n');
