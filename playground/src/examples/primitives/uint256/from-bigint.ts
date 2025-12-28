import { Uint256 } from "voltaire";
// Create Uint256 from bigint
const value = Uint256.fromBigInt(42n);

// Create from large bigint
const large = Uint256.fromBigInt(10n ** 18n); // 1 ETH in wei

// Max value
const max = Uint256.fromBigInt(2n ** 256n - 1n);

// Conversion roundtrip
const original = 123456789n;
const uint = Uint256.fromBigInt(original);
const converted = Uint256.toBigInt(uint);
