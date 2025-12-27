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
	}
	return EcPairingBaseByzantium + pairCount * EcPairingPerPairByzantium;
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

/**
 * BLAKE2F (address 0x09) - Cost per round
 * @type {1n}
 */
export const Blake2fPerRound = 1n;

/**
 * Calculate BLAKE2F precompile cost
 *
 * @param {bigint} rounds - Number of compression rounds
 * @returns {bigint} Gas cost
 */
export function calculateBlake2fCost(rounds) {
	return rounds * Blake2fPerRound;
}

/**
 * Convenience alias for BLAKE2F cost calculation
 * @param {bigint} rounds - Number of compression rounds
 * @returns {bigint} Gas cost
 */
export const blake2f = calculateBlake2fCost;

/**
 * POINT_EVALUATION (address 0x0a) - Fixed cost (EIP-4844)
 * @type {50000n}
 */
export const PointEvaluation = 50000n;

/**
 * Calculate POINT_EVALUATION precompile cost
 *
 * @returns {bigint} Gas cost (fixed at 50000)
 */
export function calculatePointEvaluationCost() {
	return PointEvaluation;
}

// ============================================
// BLS12-381 Precompiles (EIP-2537) - Prague
// ============================================

/**
 * BLS12_G1ADD (address 0x0b) - Fixed cost
 * @type {500n}
 */
export const Bls12G1Add = 500n;

/**
 * BLS12_G1MUL (address 0x0c) - Fixed cost
 * @type {12000n}
 */
export const Bls12G1Mul = 12000n;

/**
 * BLS12_G1MSM (address 0x0d) - Base cost per point
 * @type {12000n}
 */
export const Bls12G1MsmBase = 12000n;

/**
 * BLS12_G2ADD (address 0x0e) - Fixed cost
 * @type {800n}
 */
export const Bls12G2Add = 800n;

/**
 * BLS12_G2MUL (address 0x0f) - Fixed cost
 * @type {45000n}
 */
export const Bls12G2Mul = 45000n;

/**
 * BLS12_G2MSM (address 0x10) - Base cost per point
 * @type {45000n}
 */
export const Bls12G2MsmBase = 45000n;

/**
 * BLS12_PAIRING (address 0x11) - Base cost
 * @type {65000n}
 */
export const Bls12PairingBase = 65000n;

/**
 * BLS12_PAIRING - Per-pair cost
 * @type {43000n}
 */
export const Bls12PairingPerPair = 43000n;

/**
 * BLS12_MAP_FP_TO_G1 (address 0x12) - Fixed cost
 * @type {5500n}
 */
export const Bls12MapFpToG1 = 5500n;

/**
 * BLS12_MAP_FP2_TO_G2 (address 0x13) - Fixed cost
 * @type {75000n}
 */
export const Bls12MapFp2ToG2 = 75000n;

/**
 * MSM discount multipliers (EIP-2537)
 * Index k maps to multiplier for k points
 */
const MSM_DISCOUNT_TABLE = [
	0, 1000, 949, 848, 797, 764, 750, 738, 728, 719, 712, 705, 698, 692, 687, 682, 677, 673, 669,
	665, 661, 658, 654, 651, 648, 645, 642, 640, 637, 635, 632, 630, 627, 625, 623, 621, 619, 617,
	615, 613, 611, 609, 608, 606, 604, 603, 601, 599, 598, 596, 595, 593, 592, 591, 589, 588, 586,
	585, 584, 582, 581, 580, 579, 577, 576, 575, 574, 573, 572, 570, 569, 568, 567, 566, 565, 564,
	563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550, 549, 548, 547, 547, 546,
	545, 544, 543, 542, 542, 541, 540, 539, 538, 538, 537, 536, 535, 535, 534, 533, 532, 532, 531,
	530, 530, 529, 528, 528, 527, 526, 526, 525, 524, 524, 523, 522, 522,
];

/**
 * Get MSM discount multiplier for k points
 *
 * @param {number} k - Number of point-scalar pairs
 * @returns {number} Discount multiplier (divide by 1000)
 */
function getMsmDiscount(k) {
	if (k === 0) return 0;
	if (k >= MSM_DISCOUNT_TABLE.length)
		return /** @type {number} */ (
			MSM_DISCOUNT_TABLE[MSM_DISCOUNT_TABLE.length - 1]
		);
	return /** @type {number} */ (MSM_DISCOUNT_TABLE[k]);
}

/**
 * Calculate BLS12_G1MSM precompile cost
 *
 * @param {bigint} pairCount - Number of point-scalar pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12G1MsmCost(pairCount) {
	const k = Number(pairCount);
	if (k === 0) return 0n;
	const discount = BigInt(getMsmDiscount(k));
	return (Bls12G1MsmBase * pairCount * discount) / 1000n;
}

/**
 * Calculate BLS12_G2MSM precompile cost
 *
 * @param {bigint} pairCount - Number of point-scalar pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12G2MsmCost(pairCount) {
	const k = Number(pairCount);
	if (k === 0) return 0n;
	const discount = BigInt(getMsmDiscount(k));
	return (Bls12G2MsmBase * pairCount * discount) / 1000n;
}

/**
 * Calculate BLS12_PAIRING precompile cost
 *
 * @param {bigint} pairCount - Number of G1-G2 pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12PairingCost(pairCount) {
	return Bls12PairingBase + pairCount * Bls12PairingPerPair;
}
