import { Uint, Uint32, Uint64 } from "@tevm/voltaire";
const a32 = Uint32.fromNumber(1000);
const b32 = Uint32.fromNumber(250);
const base32 = Uint32.fromNumber(2);
const a64 = Uint64.fromBigInt(1000000000000n);
const b64 = Uint64.fromBigInt(250000000000n);
const oneEth = Uint.fromBigInt(1000000000000000000n); // 1 ETH = 10^18 wei
const gasPrice = Uint.fromBigInt(50000000000n); // 50 gwei
const gasUsed = Uint.fromBigInt(21000n); // Standard transfer
const txCost = Uint.times(gasPrice, gasUsed);
const principal = Uint64.fromBigInt(100000n); // $100,000
const rate = Uint64.fromBigInt(105n); // 5% = 1.05
const years = 10;
let amount = principal;
for (let i = 0; i < years; i++) {
	amount = Uint64.dividedBy(Uint64.times(amount, rate), Uint64.fromNumber(100));
}
const val = Uint32.fromNumber(100);
const result = Uint32.dividedBy(
	Uint32.times(Uint32.plus(val, Uint32.fromNumber(50)), Uint32.fromNumber(2)),
	Uint32.fromNumber(3),
);
const x = Uint32.fromNumber(42);
const y = Uint32.fromNumber(84);
const z = Uint32.fromNumber(21);
