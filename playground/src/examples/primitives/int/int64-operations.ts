import { Int64 } from "voltaire";

const balance = Int64.fromBigInt(1000000000000n); // $1,000.00
const fee = Int64.fromBigInt(-50000000n); // -$0.05 fee
const interest = Int64.fromBigInt(1234567n); // $0.001234567 interest
const after_fee = Int64.plus(balance, fee);
const final_balance = Int64.plus(after_fee, interest);
const start_ns = Int64.fromBigInt(1700000000000000000n);
const end_ns = Int64.fromBigInt(1700000001234567890n);
const duration_ns = Int64.minus(end_ns, start_ns);
const very_large_pos = Int64.fromBigInt(9000000000000000000n);
const very_large_neg = Int64.fromBigInt(-9000000000000000000n);
const a = Int64.fromBigInt(1234567890123456n);
const b = Int64.fromBigInt(-987654321098765n);
