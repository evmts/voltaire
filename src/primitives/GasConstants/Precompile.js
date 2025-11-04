/**
 * EVM Precompile Gas Costs
 *
 * Gas cost constants and calculation functions for all EVM precompiled contracts
 */

/**
 * ECRECOVER (address 0x01) - Fixed cost
 * @type {3000n}
 */
export const EcRecover = 3000n;

/**
 * SHA256 (address 0x02) - Base cost
 * @type {60n}
 */
export const Sha256Base = 60n;

/**
 * SHA256 - Per-word cost
 * @type {12n}
 */
export const Sha256Word = 12n;

/**
 * Calculate SHA256 precompile cost
 *
 * @param {bigint} dataSize - Size of data in bytes
 * @returns {bigint} Gas cost
 */
export function calculateSha256Cost(dataSize) {
	const words = (dataSize + 31n) / 32n;
	return Sha256Base + words * Sha256Word;
}

/**
 * RIPEMD160 (address 0x03) - Base cost
 * @type {600n}
 */
export const Ripemd160Base = 600n;

/**
 * RIPEMD160 - Per-word cost
 * @type {120n}
 */
export const Ripemd160Word = 120n;

/**
 * Calculate RIPEMD160 precompile cost
 *
 * @param {bigint} dataSize - Size of data in bytes
 * @returns {bigint} Gas cost
 */
export function calculateRipemd160Cost(dataSize) {
	const words = (dataSize + 31n) / 32n;
	return Ripemd160Base + words * Ripemd160Word;
}

/**
 * IDENTITY (address 0x04) - Base cost
 * @type {15n}
 */
export const IdentityBase = 15n;

/**
 * IDENTITY - Per-word cost
 * @type {3n}
 */
export const IdentityWord = 3n;

/**
 * Calculate IDENTITY precompile cost
 *
 * @param {bigint} dataSize - Size of data in bytes
 * @returns {bigint} Gas cost
 */
export function calculateIdentityCost(dataSize) {
	const words = (dataSize + 31n) / 32n;
	return IdentityBase + words * IdentityWord;
}

/**
 * MODEXP (address 0x05) - Minimum cost (EIP-2565)
 * @type {200n}
 */
export const ModExpMin = 200n;

/**
 * MODEXP - Quadratic threshold (64 bytes)
 * @type {64n}
 */
export const ModExpQuadraticThreshold = 64n;

/**
 * MODEXP - Linear threshold (1024 bytes)
 * @type {1024n}
 */
export const ModExpLinearThreshold = 1024n;

/**
 * Calculate adjusted exponent length for MODEXP
 *
 * @param {bigint} expLength - Length of exponent in bytes
 * @param {bigint} expHead - First 32 bytes of exponent
 * @returns {bigint} Adjusted exponent length
 */
function calculateAdjustedExponentLength(expLength, expHead) {
	if (expLength <= 32n) {
		if (expHead === 0n) return 0n;
		return BigInt(Math.floor(Math.log2(Number(expHead))));
	}
	const headBits =
		expHead === 0n ? 0n : BigInt(Math.floor(Math.log2(Number(expHead))));
	return 8n * (expLength - 32n) + headBits;
}

/**
 * Calculate MODEXP precompile cost
 *
 * @param {bigint} baseLength - Length of base in bytes
 * @param {bigint} expLength - Length of exponent in bytes
 * @param {bigint} modLength - Length of modulus in bytes
 * @param {bigint} expHead - First 32 bytes of exponent
 * @returns {bigint} Gas cost
 */
export function calculateModExpCost(baseLength, expLength, modLength, expHead) {
	// Complexity calculation per EIP-2565
	const maxLength = baseLength > modLength ? baseLength : modLength;
	const adjExpLen = calculateAdjustedExponentLength(expLength, expHead);

	let complexity;
	if (maxLength <= ModExpQuadraticThreshold) {
		complexity = (maxLength * maxLength) / 4n;
	} else if (maxLength <= ModExpLinearThreshold) {
		complexity = (maxLength * maxLength) / 16n + 96n * maxLength - 3072n;
	} else {
		complexity = (maxLength * maxLength) / 64n + 480n * maxLength - 199680n;
	}

	const gas = (complexity * adjExpLen) / 20n;
	return gas > ModExpMin ? gas : ModExpMin;
}

/**
 * BN254 ECADD (address 0x06) - Istanbul onwards
 * @type {150n}
 */
export const EcAddIstanbul = 150n;

/**
 * BN254 ECADD - Byzantium to Berlin
 * @type {500n}
 */
export const EcAddByzantium = 500n;

/**
 * BN254 ECMUL (address 0x07) - Istanbul onwards
 * @type {6000n}
 */
export const EcMulIstanbul = 6000n;

/**
 * BN254 ECMUL - Byzantium to Berlin
 * @type {40000n}
 */
export const EcMulByzantium = 40000n;

/**
 * BN254 ECPAIRING (address 0x08) - Base cost (Istanbul onwards)
 * @type {45000n}
 */
export const EcPairingBaseIstanbul = 45000n;

/**
 * BN254 ECPAIRING - Per-pair cost (Istanbul onwards)
 * @type {34000n}
 */
export const EcPairingPerPairIstanbul = 34000n;

/**
 * BN254 ECPAIRING - Base cost (Byzantium to Berlin)
 * @type {100000n}
 */
export const EcPairingBaseByzantium = 100000n;

/**
 * BN254 ECPAIRING - Per-pair cost (Byzantium to Berlin)
 * @type {80000n}
 */
export const EcPairingPerPairByzantium = 80000n;

/**
 * Calculate ECPAIRING precompile cost
 *
 * @param {bigint} pairCount - Number of point pairs
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas cost
 *
 * @example
 * ```typescript
 * const cost = calculateEcPairingCost(2n, 'istanbul');
 * // 45000 + (2 * 34000) = 113000 gas
 * ```
 */
export function calculateEcPairingCost(pairCount, hardfork) {
	const isIstanbulOrLater =
		hardfork === "istanbul" ||
		hardfork === "berlin" ||
		hardfork === "london" ||
		hardfork === "paris" ||
		hardfork === "shanghai" ||
		hardfork === "cancun";

	if (isIstanbulOrLater) {
		return EcPairingBaseIstanbul + pairCount * EcPairingPerPairIstanbul;
	} else {
		return EcPairingBaseByzantium + pairCount * EcPairingPerPairByzantium;
	}
}

/**
 * Get ECADD cost for hardfork
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas cost
 */
export function getEcAddCost(hardfork) {
	const isIstanbulOrLater =
		hardfork === "istanbul" ||
		hardfork === "berlin" ||
		hardfork === "london" ||
		hardfork === "paris" ||
		hardfork === "shanghai" ||
		hardfork === "cancun";
	return isIstanbulOrLater ? EcAddIstanbul : EcAddByzantium;
}

/**
 * Get ECMUL cost for hardfork
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas cost
 */
export function getEcMulCost(hardfork) {
	const isIstanbulOrLater =
		hardfork === "istanbul" ||
		hardfork === "berlin" ||
		hardfork === "london" ||
		hardfork === "paris" ||
		hardfork === "shanghai" ||
		hardfork === "cancun";
	return isIstanbulOrLater ? EcMulIstanbul : EcMulByzantium;
}

/**
 * Calculate ECPAIRING precompile cost (convenience form with this:)
 *
 * @this {{ pairCount: bigint; hardfork: import('./types.js').Hardfork }}
 * @returns {bigint}
 */
export function ecPairingCost() {
	return calculateEcPairingCost(this.pairCount, this.hardfork);
}
