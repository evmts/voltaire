import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";

// === Wei (smallest unit, 10^0) ===
const oneWei = Wei(1n);
const thousandWei = Wei(1000n);
const millionWei = Wei(1_000_000n);

// === Gwei (10^9 wei, used for gas prices) ===
const oneGwei = Gwei(1n);
const tenGwei = Gwei(10n);
const hundredGwei = Gwei(100n);

// === Ether (10^18 wei) ===
const oneEther = Ether(1n);
const halfEther = Ether(1n); // Note: Ether works with whole units
const tenEther = Ether(10n);

// === Conversions ===
// Wei to Gwei
const weiAmount = Wei(30_000_000_000n);

// Wei to Ether
const largeWei = Wei(1_500_000_000_000_000_000n);

// === Gas Price Calculations ===
const gasPrice = Gwei(30n); // 30 gwei
const gasUsed = 21_000n; // ETH transfer gas

const gasPriceWei = gasPrice.toWei();
const totalCost = gasPriceWei.times(Uint(gasUsed));

// === EIP-1559 Fee Calculation ===
const baseFee = Gwei(20n); // 20 gwei base fee
const priorityFee = Gwei(2n); // 2 gwei tip
const maxFee = Gwei(50n); // 50 gwei max

const baseFeeWei = baseFee.toWei();
const priorityFeeWei = priorityFee.toWei();

// Effective gas price = min(base + priority, max)
const effectivePrice = baseFeeWei.add(priorityFeeWei);

// === Transaction Value Examples ===
// Common transfer amounts
const dustAmount = Wei(1n); // Dust
const smallTx = Wei(1_000_000_000_000_000n); // 0.001 ETH
const mediumTx = Wei(100_000_000_000_000_000n); // 0.1 ETH
const largeTx = Wei(1_000_000_000_000_000_000n); // 1 ETH

// === Formatting for Display ===
const balance = Wei(2_345_678_901_234_567_890n);
const ethValue = balance.toU256() / 10n ** 18n;
const remainder = balance.toU256() % 10n ** 18n;
