import { Ether, Gwei, Uint, Wei } from "voltaire";
// Creating Wei values
const oneWei = Wei.from(1n);
const thousandWei = Wei.from(1000n);
const millionWei = Wei.from(1_000_000n);

const oneBillionWei = Wei.from(1_000_000_000n);
const tenBillionWei = Wei.from(10_000_000_000n);
const hundredBillionWei = Wei.from(100_000_000_000n);

const quarterEther = Wei.from(250_000_000_000_000_000n);
const halfEther = Wei.from(500_000_000_000_000_000n);
const fullEther = Wei.from(1_000_000_000_000_000_000n);
const tenEther = Wei.from(10_000_000_000_000_000_000n);

const oneGwei = Gwei.from(1n);
const tenGwei = Gwei.from(10n);
const hundredGwei = Gwei.from(100n);

const pointOneEther = Ether.from(1n); // 0.1 represented as integer
const oneEther = Ether.from(1n);
const fiveEther = Ether.from(5n);

// Transaction value
const txValue = Wei.from(100_000_000_000_000_000n);

// Gas cost calculation
const gasPrice = Wei.from(30_000_000_000n); // 30 gwei in wei
const gasUsed = 21000n;
const totalCost = Uint.times(Wei.toU256(gasPrice), Uint.from(gasUsed));

// Dust amount (very small wei value)
const dust = Wei.from(123n);
