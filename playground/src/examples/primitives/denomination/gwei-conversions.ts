import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Creating Gwei values (typical gas prices)
const veryLow = Gwei.from(5n);
const low = Gwei.from(10n);
const medium = Gwei.from(30n);
const high = Gwei.from(100n);
const extreme = Gwei.from(500n);

const oneGwei = Gwei.from(1n);
const oneThousandGwei = Gwei.from(1000n);
const oneMillion = Gwei.from(1_000_000n);
const oneBillion = Gwei.from(1_000_000_000n);

const smallWei = Wei.from(5_000_000_000n);
const mediumWei = Wei.from(30_000_000_000n);
const largeWei = Wei.from(100_000_000_000n);

const pointZeroOneEther = Ether.from(1n); // Treating as 0.01 for example
const oneEther = Ether.from(1n);
const tenEther = Ether.from(10n);

// Calculate transaction cost at different gas prices
const gasUsed = 21000n;

const costAtLow = Uint.times(Gwei.toU256(low), Uint.from(gasUsed));
const costAtMedium = Uint.times(Gwei.toU256(medium), Uint.from(gasUsed));
const costAtHigh = Uint.times(Gwei.toU256(high), Uint.from(gasUsed));

// Complex transaction
const swapGasUsed = 150000n;
const swapGasPrice = Gwei.from(40n);
const swapCost = Uint.times(Gwei.toU256(swapGasPrice), Uint.from(swapGasUsed));

const baseFee = Gwei.from(25n);
const priorityFee = Gwei.from(2n);
const maxFee = Uint.plus(Gwei.toU256(baseFee), Gwei.toU256(priorityFee));
