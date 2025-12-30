/**
 * BN254 (BN128) Pairing Curve Basics
 *
 * BN254 is a pairing-friendly elliptic curve used in Ethereum's precompiles
 * for zkSNARK verification (EIP-196, EIP-197). It provides:
 * - G1: Points on the base curve E(Fp)
 * - G2: Points on the twisted curve E'(Fp2)
 * - Pairing: Bilinear map e: G1 x G2 -> GT
 *
 * The curve equation is y^2 = x^3 + 3 over Fp where:
 * p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
 *
 * This curve is also known as alt_bn128 or bn128 in various contexts.
 */

import { BN254 } from "@tevm/voltaire";

// Access curve constants
const { G1, G2, Pairing, Fr, Fp } = BN254;

// Create the standard generator points
const g1 = G1.generator();
const g2 = G2.generator();

// Scalar field Fr - order of the curve
const FR_MOD =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// The infinity point (identity element)
const inf1 = G1.infinity();
const inf2 = G2.infinity();

// Adding identity returns the original point
const g1PlusInf = G1.add(g1, inf1);
const pairingResult = Pairing.pair(g1, g2);
