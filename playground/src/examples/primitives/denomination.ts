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
const tenEther = Ether(10n);

// === Conversions (using static methods) ===
// Wei to Gwei
const weiAmount = Wei(30_000_000_000n);
const asGwei = Wei.toGwei(weiAmount);

// Wei to Ether
const largeWei = Wei(1_500_000_000_000_000_000n);
const asEther = Wei.toEther(largeWei);

// Gwei to Wei
const gasPriceGwei = Gwei(30n);
const gasPriceWei = Gwei.toWei(gasPriceGwei);

// Ether to Wei
const ethAmount = Ether(2n);
const ethInWei = Ether.toWei(ethAmount);

// === Gas Price Calculations ===
const gasPrice = Gwei(30n); // 30 gwei
const gasUsed = 21_000n; // ETH transfer gas

const gasPriceAsWei = Gwei.toWei(gasPrice);
// Convert to Uint256 for arithmetic
const gasPriceU256 = Wei.toU256(gasPriceAsWei);
const totalCost = Uint.times(gasPriceU256, Uint(gasUsed));

// === EIP-1559 Fee Calculation ===
const baseFee = Gwei(20n); // 20 gwei base fee
const priorityFee = Gwei(2n); // 2 gwei tip
const maxFee = Gwei(50n); // 50 gwei max

const baseFeeWei = Gwei.toWei(baseFee);
const priorityFeeWei = Gwei.toWei(priorityFee);

// Effective gas price = base + priority (in Uint256 for arithmetic)
const baseFeeU256 = Wei.toU256(baseFeeWei);
const priorityU256 = Wei.toU256(priorityFeeWei);
const effectivePrice = Uint.plus(baseFeeU256, priorityU256);

// === Transaction Value Examples ===
// Common transfer amounts
const dustAmount = Wei(1n); // Dust
const smallTx = Wei(1_000_000_000_000_000n); // 0.001 ETH
const mediumTx = Wei(100_000_000_000_000_000n); // 0.1 ETH
const largeTx = Wei(1_000_000_000_000_000_000n); // 1 ETH

// === Formatting for Display ===
const balance = Wei(2_345_678_901_234_567_890n);
const balanceU256 = Wei.toU256(balance);
const ethValue = Uint.toBigInt(balanceU256) / 10n ** 18n;
const remainder = Uint.toBigInt(balanceU256) % 10n ** 18n;
