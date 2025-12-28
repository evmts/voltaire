import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";
// Creating Gwei values (typical gas prices)
const veryLow = Gwei(5n);
const low = Gwei(10n);
const medium = Gwei(30n);
const high = Gwei(100n);
const extreme = Gwei(500n);

const oneGwei = Gwei(1n);
const oneThousandGwei = Gwei(1000n);
const oneMillion = Gwei(1_000_000n);
const oneBillion = Gwei(1_000_000_000n);

const smallWei = Wei(5_000_000_000n);
const mediumWei = Wei(30_000_000_000n);
const largeWei = Wei(100_000_000_000n);

const pointZeroOneEther = Ether(1n); // Treating as 0.01 for example
const oneEther = Ether(1n);
const tenEther = Ether(10n);

// Calculate transaction cost at different gas prices
const gasUsed = 21000n;

const costAtLow = Uint.times(Gwei.toU256(low), Uint(gasUsed));
const costAtMedium = Uint.times(Gwei.toU256(medium), Uint(gasUsed));
const costAtHigh = Uint.times(Gwei.toU256(high), Uint(gasUsed));

// Complex transaction
const swapGasUsed = 150000n;
const swapGasPrice = Gwei(40n);
const swapCost = Uint.times(Gwei.toU256(swapGasPrice), Uint(swapGasUsed));

const baseFee = Gwei(25n);
const priorityFee = Gwei(2n);
const maxFee = Uint.plus(Gwei.toU256(baseFee), Gwei.toU256(priorityFee));
