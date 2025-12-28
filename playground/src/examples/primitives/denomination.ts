import { Wei, Gwei, Ether, Uint } from "@tevm/voltaire";

// === Wei (smallest unit, 10^0) ===
const oneWei = Wei(1n);
const thousandWei = Wei(1000n);
const millionWei = Wei(1_000_000n);
console.log("1 wei:", oneWei.toU256());

// === Gwei (10^9 wei, used for gas prices) ===
const oneGwei = Gwei(1n);
const tenGwei = Gwei(10n);
const hundredGwei = Gwei(100n);
console.log("1 gwei in wei:", oneGwei.toWei());
console.log("100 gwei in wei:", hundredGwei.toWei());

// === Ether (10^18 wei) ===
const oneEther = Ether(1n);
const halfEther = Ether(1n); // Note: Ether works with whole units
const tenEther = Ether(10n);
console.log("1 ether in wei:", oneEther.toWei());
console.log("10 ether in wei:", tenEther.toWei());

// === Conversions ===
// Wei to Gwei
const weiAmount = Wei(30_000_000_000n);
console.log("30 billion wei =", weiAmount.toU256() / 1_000_000_000n, "gwei");

// Wei to Ether
const largeWei = Wei(1_500_000_000_000_000_000n);
console.log("1.5 ETH in wei:", largeWei.toU256());

// === Gas Price Calculations ===
const gasPrice = Gwei(30n);  // 30 gwei
const gasUsed = 21_000n;          // ETH transfer gas

const gasPriceWei = gasPrice.toWei();
const totalCost = gasPriceWei.times(Uint(gasUsed));
console.log("Gas cost for transfer at 30 gwei:", totalCost.toBigInt(), "wei");
console.log("Gas cost in gwei:", totalCost.toBigInt() / 1_000_000_000n);

// === EIP-1559 Fee Calculation ===
const baseFee = Gwei(20n);        // 20 gwei base fee
const priorityFee = Gwei(2n);     // 2 gwei tip
const maxFee = Gwei(50n);         // 50 gwei max

const baseFeeWei = baseFee.toWei();
const priorityFeeWei = priorityFee.toWei();

// Effective gas price = min(base + priority, max)
const effectivePrice = baseFeeWei.add(priorityFeeWei);
console.log("Effective gas price:", effectivePrice.toBigInt() / 1_000_000_000n, "gwei");

// === Transaction Value Examples ===
// Common transfer amounts
const dustAmount = Wei(1n);                           // Dust
const smallTx = Wei(1_000_000_000_000_000n);         // 0.001 ETH
const mediumTx = Wei(100_000_000_000_000_000n);      // 0.1 ETH
const largeTx = Wei(1_000_000_000_000_000_000n);     // 1 ETH

console.log("Transaction amounts:");
console.log("  Dust:", dustAmount.toU256(), "wei");
console.log("  Small:", smallTx.toU256() / 10n**15n, "milliether");
console.log("  Medium:", mediumTx.toU256() / 10n**17n / 10n, "ether");
console.log("  Large:", largeTx.toU256() / 10n**18n, "ether");

// === Formatting for Display ===
const balance = Wei(2_345_678_901_234_567_890n);
const ethValue = balance.toU256() / 10n**18n;
const remainder = balance.toU256() % 10n**18n;
console.log("Balance:", ethValue, "ETH +", remainder, "wei");
