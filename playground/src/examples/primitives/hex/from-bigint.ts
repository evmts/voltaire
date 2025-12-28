import { Hex } from "voltaire";
// Convert BigInt to hex (for large values beyond Number.MAX_SAFE_INTEGER)
const bigNum = 2n ** 256n - 1n; // Max uint256
const hex = Hex.fromBigInt(bigNum);

// Ethereum amounts (wei)
const oneEther = 10n ** 18n; // 1 ETH in wei
const etherHex = Hex.fromBigInt(oneEther);

// Fixed size (32 bytes for uint256)
const small = 42n;
const hex32 = Hex.fromBigInt(small, 32);

// Zero
const zero = Hex.fromBigInt(0n);

// Large prime
const largePrime =
	115792089237316195423570985008687907853269984665640564039457584007913129639747n;
const primeHex = Hex.fromBigInt(largePrime);
