import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Creating Ether values
const oneEther = Ether.from(1n);
const fiveEther = Ether.from(5n);
const tenEther = Ether.from(10n);
const hundredEther = Ether.from(100n);
const thousandEther = Ether.from(1000n);

const halfEtherWei = Wei.from(500_000_000_000_000_000n);
const oneEtherWei = Wei.from(1_000_000_000_000_000_000n);
const twoPointFiveEtherWei = Wei.from(2_500_000_000_000_000_000n);
const fiveEtherWei = Wei.from(5_000_000_000_000_000_000n);

const oneBillionGwei = Gwei.from(1_000_000_000n);
const fiveBillionGwei = Gwei.from(5_000_000_000n);
const tenBillionGwei = Gwei.from(10_000_000_000n);

// Typical wallet balances
const smallWallet = Ether.from(2n);
const mediumWallet = Ether.from(50n);
const largeWallet = Ether.from(500n);
const whaleWallet = Ether.from(10000n);

// Common transaction values
const sendAmount = Ether.from(3n);
const sendAmountWei = Ether.toWei(sendAmount);
const gasPrice = Gwei.from(30n);
const gasUsed = 21000n;
const gasCostWei = Uint.times(Gwei.toU256(gasPrice), Uint.from(gasUsed));
const totalWei = Uint.plus(Wei.toU256(sendAmountWei), gasCostWei);

// Contract holdings
const dexLiquidity = Ether.from(125000n);
const stakingPool = Ether.from(50000n);
const treasuryBalance = Ether.from(75000n);

const totalProtocol = Uint.sum([
	Ether.toU256(dexLiquidity),
	Ether.toU256(stakingPool),
	Ether.toU256(treasuryBalance),
]);
