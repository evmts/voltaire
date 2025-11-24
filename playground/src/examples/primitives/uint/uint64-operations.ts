import * as Uint64 from "../../../primitives/Uint64/index.js";
const gb = Uint64.fromBigInt(1024n * 1024n * 1024n);
const tb = Uint64.fromBigInt(1024n * 1024n * 1024n * 1024n);
const fileSize = Uint64.fromBigInt(5497558138880n); // 5 TB
const now = Uint64.fromBigInt(1640995200000000n); // 2022-01-01 in microseconds
const later = Uint64.fromBigInt(1640995200000100n);
const diff = Uint64.minus(later, now);
const bytesReceived = Uint64.fromBigInt(9876543210123456n);
const bytesSent = Uint64.fromBigInt(1234567890123456n);
const totalTraffic = Uint64.plus(bytesReceived, bytesSent);
const userId1 = Uint64.fromBigInt(9223372036854775807n);
const userId2 = Uint64.fromBigInt(9223372036854775808n);
const a = Uint64.fromBigInt(1000000000000n);
const b = Uint64.fromBigInt(500000000000n);
const x = Uint64.fromBigInt(0xffffffffn);
const y = Uint64.fromBigInt(0xffff0000n);
const base = Uint64.fromNumber(10);
const val = Uint64.fromBigInt(123456789012345n);
