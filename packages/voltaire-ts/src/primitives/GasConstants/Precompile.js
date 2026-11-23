/**
 * EVM Precompile Gas Costs
 *
 * Gas cost constants and calculation functions for all EVM precompiled contracts
 */
import * as Hardfork from "../Hardfork/index.js";
import { isHardforkAtLeast } from "./isHardforkAtLeast.js";

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
 * Calculate MODEXP gas using EIP-198 before Berlin, EIP-2565 from Berlin,
 * and EIP-7883 from Osaka. Declared lengths are nonnegative byte counts.
 * The precompile enforces operand bounds separately from this pricing helper.
 *
 * @param {bigint} baseLength - Length of base in bytes
 * @param {bigint} expLength - Length of exponent in bytes
 * @param {bigint} modLength - Length of modulus in bytes
 * @param {bigint} expHead - First 32 bytes of exponent
 * @param {import('../Hardfork/HardforkType.js').HardforkType} [hardfork=Hardfork.BERLIN] - Active fork; defaults to Berlin pricing
 * @returns {bigint} Gas cost
 */
export function calculateModExpCost(
	baseLength,
	expLength,
	modLength,
	expHead,
	hardfork = Hardfork.BERLIN,
) {
	const maxLength = baseLength > modLength ? baseLength : modLength;
	const headBits = expHead === 0n ? 0n : BigInt(expHead.toString(2).length - 1);
	const osaka = Hardfork.isAtLeast(hardfork, Hardfork.OSAKA);
	const longByteCost = osaka ? 16n : 8n;
	const adjusted =
		expLength > 32n ? longByteCost * (expLength - 32n) + headBits : headBits;
	const iterations = adjusted > 0n ? adjusted : 1n;
	const words = (maxLength + 7n) / 8n;
	if (osaka) {
		const complexity = maxLength <= 32n ? 16n : 2n * words * words;
		const gas = complexity * iterations;
		return gas > 500n ? gas : 500n;
	}
	if (Hardfork.isAtLeast(hardfork, Hardfork.BERLIN)) {
		const gas = (words * words * iterations) / 3n;
		return gas > 200n ? gas : 200n;
	}
	let complexity = maxLength * maxLength;
	if (maxLength > 1024n) {
		complexity = complexity / 16n + 480n * maxLength - 199680n;
	} else if (maxLength > 64n) {
		complexity = complexity / 4n + 96n * maxLength - 3072n;
	}
	return (complexity * iterations) / 20n;
}

/**
 * BN254 ECADD (address 0x06) - Istanbul onwards
 * @type {150n}
 */
export const EcAddIstanbul = 150n;

/**
 * BN254 ECADD - Byzantium until Istanbul (EIP-196)
 * @type {500n}
 */
export const EcAddByzantium = 500n;

/**
 * BN254 ECMUL (address 0x07) - Istanbul onwards
 * @type {6000n}
 */
export const EcMulIstanbul = 6000n;

/**
 * BN254 ECMUL - Byzantium until Istanbul (EIP-196)
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
 * BN254 ECPAIRING - Base cost (Byzantium until Istanbul, EIP-197)
 * @type {100000n}
 */
export const EcPairingBaseByzantium = 100000n;

/**
 * BN254 ECPAIRING - Per-pair cost (Byzantium until Istanbul, EIP-197)
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
	const isIstanbulOrLater = isHardforkAtLeast(hardfork, Hardfork.ISTANBUL);

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
	const isIstanbulOrLater = isHardforkAtLeast(hardfork, Hardfork.ISTANBUL);
	return isIstanbulOrLater ? EcAddIstanbul : EcAddByzantium;
}

/**
 * Get ECMUL cost for hardfork
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas cost
 */
export function getEcMulCost(hardfork) {
	const isIstanbulOrLater = isHardforkAtLeast(hardfork, Hardfork.ISTANBUL);
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
 * @type {375n}
 */
export const Bls12G1Add = 375n;

/**
 * BLS12_G1MSM (address 0x0c) - G1 multiplication cost per pair, before discount
 * @type {12000n}
 */
export const Bls12G1MsmBase = 12000n;

/**
 * BLS12_G2ADD (address 0x0d) - Fixed cost
 * @type {600n}
 */
export const Bls12G2Add = 600n;

/**
 * BLS12_G2MSM (address 0x0e) - G2 multiplication cost per pair, before discount
 * @type {22500n}
 */
export const Bls12G2MsmBase = 22500n;

/**
 * BLS12_PAIRING_CHECK (address 0x0f) - Base cost
 * @type {37700n}
 */
export const Bls12PairingBase = 37700n;

/**
 * BLS12_PAIRING_CHECK - Per-pair cost
 * @type {32600n}
 */
export const Bls12PairingPerPair = 32600n;

/**
 * BLS12_MAP_FP_TO_G1 (address 0x10) - Fixed cost
 * @type {5500n}
 */
export const Bls12MapFpToG1 = 5500n;

/**
 * BLS12_MAP_FP2_TO_G2 (address 0x11) - Fixed cost
 * @type {23800n}
 */
export const Bls12MapFp2ToG2 = 23800n;

/**
 * MSM discount divisor (EIP-2537 `multiplier`)
 * @type {1000n}
 */
export const Bls12MsmMultiplier = 1000n;

/**
 * G1 MSM discounts (EIP-2537). Entry `k - 1` is the discount for `k` pairs;
 * the last entry (519) is `max_discount` for every `k > 128`.
 * @type {readonly bigint[]}
 */
export const Bls12G1MsmDiscountTable = Object.freeze([
	1000n,
	949n,
	848n,
	797n,
	764n,
	750n,
	738n,
	728n,
	719n,
	712n,
	705n,
	698n,
	692n,
	687n,
	682n,
	677n,
	673n,
	669n,
	665n,
	661n,
	658n,
	654n,
	651n,
	648n,
	645n,
	642n,
	640n,
	637n,
	635n,
	632n,
	630n,
	627n,
	625n,
	623n,
	621n,
	619n,
	617n,
	615n,
	613n,
	611n,
	609n,
	608n,
	606n,
	604n,
	603n,
	601n,
	599n,
	598n,
	596n,
	595n,
	593n,
	592n,
	591n,
	589n,
	588n,
	586n,
	585n,
	584n,
	582n,
	581n,
	580n,
	579n,
	577n,
	576n,
	575n,
	574n,
	573n,
	572n,
	570n,
	569n,
	568n,
	567n,
	566n,
	565n,
	564n,
	563n,
	562n,
	561n,
	560n,
	559n,
	558n,
	557n,
	556n,
	555n,
	554n,
	553n,
	552n,
	551n,
	550n,
	549n,
	548n,
	547n,
	547n,
	546n,
	545n,
	544n,
	543n,
	542n,
	541n,
	540n,
	540n,
	539n,
	538n,
	537n,
	536n,
	536n,
	535n,
	534n,
	533n,
	532n,
	532n,
	531n,
	530n,
	529n,
	528n,
	528n,
	527n,
	526n,
	525n,
	525n,
	524n,
	523n,
	522n,
	522n,
	521n,
	520n,
	520n,
	519n,
]);

/**
 * G2 MSM discounts (EIP-2537). Entry `k - 1` is the discount for `k` pairs;
 * the last entry (524) is `max_discount` for every `k > 128`.
 * @type {readonly bigint[]}
 */
export const Bls12G2MsmDiscountTable = Object.freeze([
	1000n,
	1000n,
	923n,
	884n,
	855n,
	832n,
	812n,
	796n,
	782n,
	770n,
	759n,
	749n,
	740n,
	732n,
	724n,
	717n,
	711n,
	704n,
	699n,
	693n,
	688n,
	683n,
	679n,
	674n,
	670n,
	666n,
	663n,
	659n,
	655n,
	652n,
	649n,
	646n,
	643n,
	640n,
	637n,
	634n,
	632n,
	629n,
	627n,
	624n,
	622n,
	620n,
	618n,
	615n,
	613n,
	611n,
	609n,
	607n,
	606n,
	604n,
	602n,
	600n,
	598n,
	597n,
	595n,
	593n,
	592n,
	590n,
	589n,
	587n,
	586n,
	584n,
	583n,
	582n,
	580n,
	579n,
	578n,
	576n,
	575n,
	574n,
	573n,
	571n,
	570n,
	569n,
	568n,
	567n,
	566n,
	565n,
	563n,
	562n,
	561n,
	560n,
	559n,
	558n,
	557n,
	556n,
	555n,
	554n,
	553n,
	552n,
	552n,
	551n,
	550n,
	549n,
	548n,
	547n,
	546n,
	545n,
	545n,
	544n,
	543n,
	542n,
	541n,
	541n,
	540n,
	539n,
	538n,
	537n,
	537n,
	536n,
	535n,
	535n,
	534n,
	533n,
	532n,
	532n,
	531n,
	530n,
	530n,
	529n,
	528n,
	528n,
	527n,
	526n,
	526n,
	525n,
	524n,
	524n,
]);

/**
 * Calculate MSM cost: `(k * multiplication_cost * discount) // multiplier`.
 *
 * @param {bigint} pairCount - Number of point-scalar pairs (k)
 * @param {bigint} multiplicationCost - Per-pair multiplication cost
 * @param {readonly bigint[]} table - Discount table for the group
 * @returns {bigint} Gas cost (0 for `k = 0`)
 */
function calculateMsmCost(pairCount, multiplicationCost, table) {
	if (pairCount <= 0n) return 0n;
	const index =
		pairCount > BigInt(table.length) ? table.length - 1 : Number(pairCount) - 1;
	const discount = /** @type {bigint} */ (table[index]);
	return (pairCount * multiplicationCost * discount) / Bls12MsmMultiplier;
}

/**
 * Calculate BLS12_G1MSM precompile cost
 *
 * @param {bigint} pairCount - Number of point-scalar pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12G1MsmCost(pairCount) {
	return calculateMsmCost(pairCount, Bls12G1MsmBase, Bls12G1MsmDiscountTable);
}

/**
 * Calculate BLS12_G2MSM precompile cost
 *
 * @param {bigint} pairCount - Number of point-scalar pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12G2MsmCost(pairCount) {
	return calculateMsmCost(pairCount, Bls12G2MsmBase, Bls12G2MsmDiscountTable);
}

/**
 * Calculate BLS12_PAIRING_CHECK precompile cost: `32600 * k + 37700`
 *
 * @param {bigint} pairCount - Number of G1-G2 pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12PairingCost(pairCount) {
	return Bls12PairingBase + pairCount * Bls12PairingPerPair;
}

// ============================================
// secp256r1 Precompile (EIP-7951) - Osaka
// ============================================

/**
 * P256VERIFY (address 0x0100) - Fixed cost (EIP-7951, Osaka)
 * @type {6900n}
 */
export const P256Verify = 6900n;

/**
 * P256VERIFY (address 0x0100) - Fixed cost, EIP-7951 spec spelling
 * @type {6900n}
 */
export const P256VERIFY_GAS = P256Verify;

/**
 * Calculate P256VERIFY precompile cost (EIP-7951, Osaka)
 *
 * @returns {bigint} Gas cost (fixed at 6900, charged for every call)
 */
export function calculateP256VerifyCost() {
	return P256Verify;
}
