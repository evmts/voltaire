import { BaseFeePerGas } from "@tevm/voltaire";

// Create various base fees
const veryLow = BaseFeePerGas.fromGwei(5n);
const low = BaseFeePerGas.fromGwei(15n);
const medium = BaseFeePerGas.fromGwei(30n);
const high = BaseFeePerGas.fromGwei(100n);
const veryHigh = BaseFeePerGas.fromGwei(500n);
const fee1 = BaseFeePerGas.fromGwei(25n);
const fee2 = BaseFeePerGas.fromGwei(25n);
const fee3 = BaseFeePerGas.fromWei(25000000000n); // Same as 25 gwei
const fee4 = BaseFeePerGas.fromGwei(30n);

// Helper to describe comparison
function describeComparison(a: bigint, b: bigint): string {
	const result = BaseFeePerGas.compare(a, b);
	if (result < 0) return "less than";
	if (result > 0) return "greater than";
	return "equal to";
}
const unsorted = [high, veryLow, medium, veryHigh, low];
const sorted = [...unsorted].sort((a, b) => BaseFeePerGas.compare(a, b));
unsorted.forEach((fee) => console.log(BaseFeePerGas.toGwei(fee)));
sorted.forEach((fee) => console.log(BaseFeePerGas.toGwei(fee)));
[...sorted].reverse().forEach((fee) => console.log(BaseFeePerGas.toGwei(fee)));
const fees = [veryLow, low, medium, high, veryHigh];
const minFee = fees.reduce((min, fee) =>
	BaseFeePerGas.compare(fee, min) < 0 ? fee : min,
);
const maxFee = fees.reduce((max, fee) =>
	BaseFeePerGas.compare(fee, max) > 0 ? fee : max,
);
const currentFee = BaseFeePerGas.fromGwei(35n);
const maxAcceptable = BaseFeePerGas.fromGwei(50n);
const minAcceptable = BaseFeePerGas.fromGwei(10n);

const isAcceptable =
	BaseFeePerGas.compare(currentFee, minAcceptable) >= 0 &&
	BaseFeePerGas.compare(currentFee, maxAcceptable) <= 0;
const morningFee = BaseFeePerGas.fromGwei(20n);
const afternoonFee = BaseFeePerGas.fromGwei(35n);
const nightFee = BaseFeePerGas.fromGwei(10n);

const cheapest = [morningFee, afternoonFee, nightFee].reduce((min, fee) =>
	BaseFeePerGas.compare(fee, min) < 0 ? fee : min,
);
const baseline = BaseFeePerGas.fromGwei(20n);
const comparison = BaseFeePerGas.fromGwei(25n);

const diff =
	BaseFeePerGas.toBigInt(comparison) - BaseFeePerGas.toBigInt(baseline);
const percentDiff = (diff * 100n) / BaseFeePerGas.toBigInt(baseline);
