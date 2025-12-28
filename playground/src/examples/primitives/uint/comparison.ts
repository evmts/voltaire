import { Uint128, Uint32, Uint64, Uint8 } from "voltaire";
const a = Uint32.fromNumber(42);
const b = Uint32.fromNumber(42);
const c = Uint32.fromNumber(99);
const x = Uint32.fromNumber(100);
const y = Uint32.fromNumber(200);
const z = Uint32.fromNumber(150);
const p = Uint128.fromBigInt(1000000000000000000n);
const q = Uint128.fromBigInt(2000000000000000000n);
const val1 = Uint64.fromBigInt(9876543210n);
const val2 = Uint64.fromBigInt(1234567890n);
const val3 = Uint64.fromBigInt(5555555555n);
const values = [
	Uint8.fromNumber(50),
	Uint8.fromNumber(10),
	Uint8.fromNumber(200),
	Uint8.fromNumber(75),
	Uint8.fromNumber(5),
];
values.sort((a, b) => {
	if (Uint8.lessThan(a, b)) return -1;
	if (Uint8.greaterThan(a, b)) return 1;
	return 0;
});
const value = Uint32.fromNumber(50);
const min = Uint32.fromNumber(0);
const max = Uint32.fromNumber(100);
const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) =>
	Uint32.fromNumber(n),
);
const target = Uint32.fromNumber(45);
let low = 0;
let high = sorted.length - 1;
while (low <= high) {
	const mid = Math.floor((low + high) / 2);
	if (Uint32.equals(sorted[mid], target)) {
		break;
	}
	if (Uint32.lessThan(sorted[mid], target)) {
		low = mid + 1;
	} else {
		high = mid - 1;
	}
}
if (low > high) {
}
const counter = Uint64.fromBigInt(1000000000n);
const threshold = Uint64.fromBigInt(999999999n);
