import { BaseFeePerGas } from "@tevm/voltaire";

const fromWei = BaseFeePerGas.fromWei(25000000000n);
const fromGwei = BaseFeePerGas.fromGwei(25n);
const fromHex = BaseFeePerGas("0x5d21dba00");
const fromNumber = BaseFeePerGas(25000000000);
const baseFee = BaseFeePerGas.fromGwei(30n);
const gweiValues = [1n, 10n, 25n, 100n, 1000n];

gweiValues.forEach((gwei) => {
	const fee = BaseFeePerGas.fromGwei(gwei);
	const wei = BaseFeePerGas.toWei(fee);
});
const weiValues = [
	1000000000n, // 1 gwei
	5000000000n, // 5 gwei
	15000000000n, // 15 gwei
	30000000000n, // 30 gwei
	100000000000n, // 100 gwei
];

weiValues.forEach((wei) => {
	const fee = BaseFeePerGas.fromWei(wei);
	const gwei = BaseFeePerGas.toGwei(fee);
});
// Note: Gwei is the smallest practical unit, but internally uses Wei
const fractionalWei = 15500000000n; // 15.5 gwei in wei
const fractionalFee = BaseFeePerGas.fromWei(fractionalWei);
const extremeFee = BaseFeePerGas.fromGwei(10000n); // 10,000 gwei
const gasUsed = 21000n; // Simple transfer
const baseFeeGwei = BaseFeePerGas.fromGwei(25n);
const baseFeeWei = BaseFeePerGas.toWei(baseFeeGwei);

const costWei = baseFeeWei * gasUsed;
const costGwei = costWei / 1000000000n;
const costEth = Number(costWei) / 1e18;
const displayFee = BaseFeePerGas.fromGwei(25n);
