import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";
// Creating Wei values
const oneWei = Wei(1n);
const thousandWei = Wei(1000n);
const millionWei = Wei(1_000_000n);

const oneBillionWei = Wei(1_000_000_000n);
const tenBillionWei = Wei(10_000_000_000n);
const hundredBillionWei = Wei(100_000_000_000n);

const quarterEther = Wei(250_000_000_000_000_000n);
const halfEther = Wei(500_000_000_000_000_000n);
const fullEther = Wei(1_000_000_000_000_000_000n);
const tenEther = Wei(10_000_000_000_000_000_000n);

const oneGwei = Gwei(1n);
const tenGwei = Gwei(10n);
const hundredGwei = Gwei(100n);

const pointOneEther = Ether(1n); // 0.1 represented as integer
const oneEther = Ether(1n);
const fiveEther = Ether(5n);

// Transaction value
const txValue = Wei(100_000_000_000_000_000n);

// Gas cost calculation
const gasPrice = Wei(30_000_000_000n); // 30 gwei in wei
const gasUsed = 21000n;
const totalCost = Uint.times(Wei.toU256(gasPrice), Uint(gasUsed));

// Dust amount (very small wei value)
const dust = Wei(123n);
