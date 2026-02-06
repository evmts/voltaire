import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";
// Creating Ether values
const oneEther = Ether(1n);
const fiveEther = Ether(5n);
const tenEther = Ether(10n);
const hundredEther = Ether(100n);
const thousandEther = Ether(1000n);

const halfEtherWei = Wei(500_000_000_000_000_000n);
const oneEtherWei = Wei(1_000_000_000_000_000_000n);
const twoPointFiveEtherWei = Wei(2_500_000_000_000_000_000n);
const fiveEtherWei = Wei(5_000_000_000_000_000_000n);

const oneBillionGwei = Gwei(1_000_000_000n);
const fiveBillionGwei = Gwei(5_000_000_000n);
const tenBillionGwei = Gwei(10_000_000_000n);

// Typical wallet balances
const smallWallet = Ether(2n);
const mediumWallet = Ether(50n);
const largeWallet = Ether(500n);
const whaleWallet = Ether(10000n);

// Common transaction values
const sendAmount = Ether(3n);
const sendAmountWei = Ether.toWei(sendAmount);
const gasPrice = Gwei(30n);
const gasUsed = 21000n;
const gasCostWei = Uint.times(Gwei.toU256(gasPrice), Uint(gasUsed));
const totalWei = Uint.plus(Wei.toU256(sendAmountWei), gasCostWei);

// Contract holdings
const dexLiquidity = Ether(125000n);
const stakingPool = Ether(50000n);
const treasuryBalance = Ether(75000n);

const totalProtocol = Uint.sum([
	Ether.toU256(dexLiquidity),
	Ether.toU256(stakingPool),
	Ether.toU256(treasuryBalance),
]);
