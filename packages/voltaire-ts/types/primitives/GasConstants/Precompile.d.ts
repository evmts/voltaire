/**
 * Calculate SHA256 precompile cost
 *
 * @param {bigint} dataSize - Size of data in bytes
 * @returns {bigint} Gas cost
 */
export function calculateSha256Cost(dataSize: bigint): bigint;
/**
 * Calculate RIPEMD160 precompile cost
 *
 * @param {bigint} dataSize - Size of data in bytes
 * @returns {bigint} Gas cost
 */
export function calculateRipemd160Cost(dataSize: bigint): bigint;
/**
 * Calculate IDENTITY precompile cost
 *
 * @param {bigint} dataSize - Size of data in bytes
 * @returns {bigint} Gas cost
 */
export function calculateIdentityCost(dataSize: bigint): bigint;
/**
 * Calculate MODEXP precompile cost
 *
 * @param {bigint} baseLength - Length of base in bytes
 * @param {bigint} expLength - Length of exponent in bytes
 * @param {bigint} modLength - Length of modulus in bytes
 * @param {bigint} expHead - First 32 bytes of exponent
 * @returns {bigint} Gas cost
 */
export function calculateModExpCost(baseLength: bigint, expLength: bigint, modLength: bigint, expHead: bigint): bigint;
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
export function calculateEcPairingCost(pairCount: bigint, hardfork: import("./types.js").Hardfork): bigint;
/**
 * Get ECADD cost for hardfork
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas cost
 */
export function getEcAddCost(hardfork: import("./types.js").Hardfork): bigint;
/**
 * Get ECMUL cost for hardfork
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas cost
 */
export function getEcMulCost(hardfork: import("./types.js").Hardfork): bigint;
/**
 * Calculate ECPAIRING precompile cost (convenience form with this:)
 *
 * @this {{ pairCount: bigint; hardfork: import('./types.js').Hardfork }}
 * @returns {bigint}
 */
export function ecPairingCost(this: {
    pairCount: bigint;
    hardfork: import("./types.js").Hardfork;
}): bigint;
/**
 * Calculate BLAKE2F precompile cost
 *
 * @param {bigint} rounds - Number of compression rounds
 * @returns {bigint} Gas cost
 */
export function calculateBlake2fCost(rounds: bigint): bigint;
/**
 * Calculate POINT_EVALUATION precompile cost
 *
 * @returns {bigint} Gas cost (fixed at 50000)
 */
export function calculatePointEvaluationCost(): bigint;
/**
 * Calculate BLS12_G1MSM precompile cost
 *
 * @param {bigint} pairCount - Number of point-scalar pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12G1MsmCost(pairCount: bigint): bigint;
/**
 * Calculate BLS12_G2MSM precompile cost
 *
 * @param {bigint} pairCount - Number of point-scalar pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12G2MsmCost(pairCount: bigint): bigint;
/**
 * Calculate BLS12_PAIRING precompile cost
 *
 * @param {bigint} pairCount - Number of G1-G2 pairs
 * @returns {bigint} Gas cost
 */
export function calculateBls12PairingCost(pairCount: bigint): bigint;
/**
 * EVM Precompile Gas Costs
 *
 * Gas cost constants and calculation functions for all EVM precompiled contracts
 */
/**
 * ECRECOVER (address 0x01) - Fixed cost
 * @type {3000n}
 */
export const EcRecover: 3000n;
/**
 * SHA256 (address 0x02) - Base cost
 * @type {60n}
 */
export const Sha256Base: 60n;
/**
 * SHA256 - Per-word cost
 * @type {12n}
 */
export const Sha256Word: 12n;
/**
 * RIPEMD160 (address 0x03) - Base cost
 * @type {600n}
 */
export const Ripemd160Base: 600n;
/**
 * RIPEMD160 - Per-word cost
 * @type {120n}
 */
export const Ripemd160Word: 120n;
/**
 * IDENTITY (address 0x04) - Base cost
 * @type {15n}
 */
export const IdentityBase: 15n;
/**
 * IDENTITY - Per-word cost
 * @type {3n}
 */
export const IdentityWord: 3n;
/**
 * MODEXP (address 0x05) - Minimum cost (EIP-2565)
 * @type {200n}
 */
export const ModExpMin: 200n;
/**
 * MODEXP - Quadratic threshold (64 bytes)
 * @type {64n}
 */
export const ModExpQuadraticThreshold: 64n;
/**
 * MODEXP - Linear threshold (1024 bytes)
 * @type {1024n}
 */
export const ModExpLinearThreshold: 1024n;
/**
 * BN254 ECADD (address 0x06) - Istanbul onwards
 * @type {150n}
 */
export const EcAddIstanbul: 150n;
/**
 * BN254 ECADD - Byzantium to Berlin
 * @type {500n}
 */
export const EcAddByzantium: 500n;
/**
 * BN254 ECMUL (address 0x07) - Istanbul onwards
 * @type {6000n}
 */
export const EcMulIstanbul: 6000n;
/**
 * BN254 ECMUL - Byzantium to Berlin
 * @type {40000n}
 */
export const EcMulByzantium: 40000n;
/**
 * BN254 ECPAIRING (address 0x08) - Base cost (Istanbul onwards)
 * @type {45000n}
 */
export const EcPairingBaseIstanbul: 45000n;
/**
 * BN254 ECPAIRING - Per-pair cost (Istanbul onwards)
 * @type {34000n}
 */
export const EcPairingPerPairIstanbul: 34000n;
/**
 * BN254 ECPAIRING - Base cost (Byzantium to Berlin)
 * @type {100000n}
 */
export const EcPairingBaseByzantium: 100000n;
/**
 * BN254 ECPAIRING - Per-pair cost (Byzantium to Berlin)
 * @type {80000n}
 */
export const EcPairingPerPairByzantium: 80000n;
/**
 * BLAKE2F (address 0x09) - Cost per round
 * @type {1n}
 */
export const Blake2fPerRound: 1n;
/**
 * Calculate BLAKE2F precompile cost
 *
 * @param {bigint} rounds - Number of compression rounds
 * @returns {bigint} Gas cost
 */
export function blake2f(rounds: bigint): bigint;
/**
 * POINT_EVALUATION (address 0x0a) - Fixed cost (EIP-4844)
 * @type {50000n}
 */
export const PointEvaluation: 50000n;
/**
 * BLS12_G1ADD (address 0x0b) - Fixed cost
 * @type {500n}
 */
export const Bls12G1Add: 500n;
/**
 * BLS12_G1MUL (address 0x0c) - Fixed cost
 * @type {12000n}
 */
export const Bls12G1Mul: 12000n;
/**
 * BLS12_G1MSM (address 0x0d) - Base cost per point
 * @type {12000n}
 */
export const Bls12G1MsmBase: 12000n;
/**
 * BLS12_G2ADD (address 0x0e) - Fixed cost
 * @type {800n}
 */
export const Bls12G2Add: 800n;
/**
 * BLS12_G2MUL (address 0x0f) - Fixed cost
 * @type {45000n}
 */
export const Bls12G2Mul: 45000n;
/**
 * BLS12_G2MSM (address 0x10) - Base cost per point
 * @type {45000n}
 */
export const Bls12G2MsmBase: 45000n;
/**
 * BLS12_PAIRING (address 0x11) - Base cost
 * @type {65000n}
 */
export const Bls12PairingBase: 65000n;
/**
 * BLS12_PAIRING - Per-pair cost
 * @type {43000n}
 */
export const Bls12PairingPerPair: 43000n;
/**
 * BLS12_MAP_FP_TO_G1 (address 0x12) - Fixed cost
 * @type {5500n}
 */
export const Bls12MapFpToG1: 5500n;
/**
 * BLS12_MAP_FP2_TO_G2 (address 0x13) - Fixed cost
 * @type {75000n}
 */
export const Bls12MapFp2ToG2: 75000n;
//# sourceMappingURL=Precompile.d.ts.map