import * as Int32 from "../../../primitives/Int32/index.js";
import * as Int64 from "../../../primitives/Int64/index.js";
const pos = Int32.fromNumber(100);
const neg = Int32.fromNumber(-50);
const revenue = Int64.fromBigInt(1000000n);
const costs = Int64.fromBigInt(-750000n);
const taxes = Int64.fromBigInt(-100000n);
const profit = Int64.plus(Int64.plus(revenue, costs), taxes);
const high = Int32.fromNumber(30);
const low = Int32.fromNumber(-15);
const range = Int32.minus(high, low);
const avg = Int32.dividedBy(Int32.plus(high, low), 2);
const base = Int32.fromNumber(5000);
const offsets = [
	Int32.fromNumber(-100),
	Int32.fromNumber(50),
	Int32.fromNumber(-25),
	Int32.fromNumber(75),
];
for (let i = 0; i < offsets.length; i++) {
	const result = Int32.plus(base, offsets[i]);
}
