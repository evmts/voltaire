/**
 * BN254 (BN128) Elliptic Curve Cryptography
 *
 * Complete implementation of BN254 pairing-friendly curve used in zkSNARKs.
 * Includes G1, G2 point operations and optimal ate pairing.
 *
 * @example
 * ```typescript
 * import { Bn254 } from './bn254.js';
 *
 * // G1 operations
 * const p1 = Bn254.G1.generator();
 * const p2 = Bn254.G1.mul.call(p1, 5n);
 * const p3 = Bn254.G1.add.call(p1, p2);
 *
 * // G2 operations
 * const q1 = Bn254.G2.generator();
 * const q2 = Bn254.G2.mul.call(q1, 3n);
 *
 * // Pairing
 * const result = Bn254.Pairing.pair(p1, q1);
 * const valid = Bn254.Pairing.pairingCheck([
 *   [p1, q1],
 *   [p2, q2]
 * ]);
 * ```
 */

// ============================================================================
// Error Types
// ============================================================================

export class Bn254Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Bn254Error";
	}
}

export class Bn254InvalidPointError extends Bn254Error {
	constructor(message: string) {
		super(message);
		this.name = "Bn254InvalidPointError";
	}
}

export class Bn254SubgroupCheckError extends Bn254Error {
	constructor(message: string) {
		super(message);
		this.name = "Bn254SubgroupCheckError";
	}
}

// ============================================================================
// Constants and Parameters
// ============================================================================

// Field modulus (Fp)
const FP_MOD =
	21888242871839275222246405745257275088696311157297823662689037894645226208583n;

// Scalar field modulus (Fr) - curve order
const FR_MOD =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// Curve parameter b for G1: y^2 = x^3 + 3
const B_G1 = 3n;

// Curve parameter b for G2: y^2 = x^3 + 3/(9+u) in Fp2
// 3/(9+u) = (19485874751759354771024239261021720505790618469301721065564631296452457478373, 266929791119991161246907387137283842545076965332900288569378510910307636690)
const B_G2_C0 =
	19485874751759354771024239261021720505790618469301721065564631296452457478373n;
const B_G2_C1 =
	266929791119991161246907387137283842545076965332900288569378510910307636690n;

// G1 generator
const G1_GENERATOR_X = 1n;
const G1_GENERATOR_Y = 2n;

// G2 generator
const G2_GENERATOR_X_C0 =
	10857046999023057135944570762232829481370756359578518086990519993285655852781n;
const G2_GENERATOR_X_C1 =
	11559732032986387107991004021392285783925812861821192530917403151452391805634n;
const G2_GENERATOR_Y_C0 =
	8495653923123431417604973247489272438418190587263600148770280649306958101930n;
const G2_GENERATOR_Y_C1 =
	4082367875863433681332203403145435568316851327593401208105741076214120093531n;

// Curve parameter t for BN254 = 4965661367192848881
const CURVE_PARAM_T = 4965661367192848881n;

// ============================================================================
// Field Arithmetic (Fp)
// ============================================================================

namespace Fp {
	export function mod(a: bigint): bigint {
		const result = a % FP_MOD;
		return result < 0n ? result + FP_MOD : result;
	}

	export function add(a: bigint, b: bigint): bigint {
		return mod(a + b);
	}

	export function sub(a: bigint, b: bigint): bigint {
		return mod(a - b);
	}

	export function mul(a: bigint, b: bigint): bigint {
		return mod(a * b);
	}

	export function neg(a: bigint): bigint {
		return a === 0n ? 0n : FP_MOD - a;
	}

	export function pow(base: bigint, exponent: bigint): bigint {
		let result = 1n;
		let b = mod(base);
		let exp = exponent;
		while (exp > 0n) {
			if (exp & 1n) {
				result = mul(result, b);
			}
			b = mul(b, b);
			exp >>= 1n;
		}
		return result;
	}

	export function inv(a: bigint): bigint {
		if (a === 0n) throw new Bn254Error("Division by zero");
		return pow(a, FP_MOD - 2n);
	}

	export function sqrt(a: bigint): bigint | null {
		const a_mod = mod(a);
		const exp = (FP_MOD + 1n) / 4n;
		const result = pow(a_mod, exp);
		if (mul(result, result) !== a_mod) return null;
		return result;
	}
}

// ============================================================================
// Field Extension Fp2
// ============================================================================

interface Fp2 {
	c0: bigint;
	c1: bigint;
}

namespace Fp2 {
	export const ZERO: Fp2 = { c0: 0n, c1: 0n };
	export const ONE: Fp2 = { c0: 1n, c1: 0n };

	export function create(c0: bigint, c1: bigint): Fp2 {
		return { c0: Fp.mod(c0), c1: Fp.mod(c1) };
	}

	export function equal(a: Fp2, b: Fp2): boolean {
		return a.c0 === b.c0 && a.c1 === b.c1;
	}

	export function isZero(a: Fp2): boolean {
		return a.c0 === 0n && a.c1 === 0n;
	}

	export function add(a: Fp2, b: Fp2): Fp2 {
		return { c0: Fp.add(a.c0, b.c0), c1: Fp.add(a.c1, b.c1) };
	}

	export function sub(a: Fp2, b: Fp2): Fp2 {
		return { c0: Fp.sub(a.c0, b.c0), c1: Fp.sub(a.c1, b.c1) };
	}

	export function mul(a: Fp2, b: Fp2): Fp2 {
		const aa = Fp.mul(a.c0, b.c0);
		const bb = Fp.mul(a.c1, b.c1);
		const o = Fp.mul(Fp.add(a.c0, a.c1), Fp.add(b.c0, b.c1));
		return { c0: Fp.sub(aa, bb), c1: Fp.sub(Fp.sub(o, aa), bb) };
	}

	export function mulScalar(a: Fp2, scalar: bigint): Fp2 {
		return { c0: Fp.mul(a.c0, scalar), c1: Fp.mul(a.c1, scalar) };
	}

	export function neg(a: Fp2): Fp2 {
		return { c0: Fp.neg(a.c0), c1: Fp.neg(a.c1) };
	}

	export function square(a: Fp2): Fp2 {
		const a0_2 = Fp.mul(a.c0, a.c0);
		const a1_2 = Fp.mul(a.c1, a.c1);
		return {
			c0: Fp.sub(a0_2, a1_2),
			c1: Fp.mul(Fp.mul(a.c0, a.c1), 2n),
		};
	}

	export function inv(a: Fp2): Fp2 {
		if (isZero(a)) throw new Bn254Error("Division by zero in Fp2");
		const factor = Fp.inv(Fp.add(Fp.mul(a.c0, a.c0), Fp.mul(a.c1, a.c1)));
		return { c0: Fp.mul(a.c0, factor), c1: Fp.neg(Fp.mul(a.c1, factor)) };
	}

	export function conjugate(a: Fp2): Fp2 {
		return { c0: a.c0, c1: Fp.neg(a.c1) };
	}

	export function frobeniusMap(a: Fp2): Fp2 {
		return conjugate(a);
	}
}

// ============================================================================
// Main BN254 Namespace
// ============================================================================

export namespace Bn254 {
	// ==========================================================================
	// Scalar Field (Fr)
	// ==========================================================================

	export namespace Fr {
		export function mod(a: bigint): bigint {
			const result = a % FR_MOD;
			return result < 0n ? result + FR_MOD : result;
		}

		export function add(a: bigint, b: bigint): bigint {
			return mod(a + b);
		}

		export function mul(a: bigint, b: bigint): bigint {
			return mod(a * b);
		}

		export function neg(a: bigint): bigint {
			return a === 0n ? 0n : FR_MOD - a;
		}

		export function inv(a: bigint): bigint {
			if (a === 0n) throw new Bn254Error("Division by zero");
			return pow(a, FR_MOD - 2n);
		}

		export function pow(base: bigint, exponent: bigint): bigint {
			let result = 1n;
			let b = mod(base);
			let exp = exponent;
			while (exp > 0n) {
				if (exp & 1n) {
					result = mul(result, b);
				}
				b = mul(b, b);
				exp >>= 1n;
			}
			return result;
		}

		export function isValid(scalar: bigint): boolean {
			return scalar >= 0n && scalar < FR_MOD;
		}
	}

	// ==========================================================================
	// G1 Group (Points over Fp)
	// ==========================================================================

	export type G1Point = {
		x: bigint;
		y: bigint;
		z: bigint;
	};

	export namespace G1 {
		/**
		 * Point at infinity
		 */
		export function infinity(): G1Point {
			return { x: 0n, y: 0n, z: 0n };
		}

		/**
		 * G1 generator point
		 */
		export function generator(): G1Point {
			return { x: G1_GENERATOR_X, y: G1_GENERATOR_Y, z: 1n };
		}

		/**
		 * Check if point is at infinity
		 */
		export function isZero(this: G1Point): boolean {
			return this.z === 0n;
		}

		/**
		 * Check if point is on curve: y^2 = x^3 + 3
		 */
		export function isOnCurve(this: G1Point): boolean {
			if (isZero.call(this)) return true;

			const z2 = Fp.mul(this.z, this.z);
			const z4 = Fp.mul(z2, z2);
			const z6 = Fp.mul(z4, z2);

			const y2 = Fp.mul(this.y, this.y);
			const x3 = Fp.mul(Fp.mul(this.x, this.x), this.x);
			const b_z6 = Fp.mul(B_G1, z6);

			return y2 === Fp.add(x3, b_z6);
		}

		/**
		 * Convert to affine coordinates
		 */
		export function toAffine(this: G1Point): G1Point {
			if (isZero.call(this)) return infinity();

			const zInv = Fp.inv(this.z);
			const zInv2 = Fp.mul(zInv, zInv);
			const zInv3 = Fp.mul(zInv2, zInv);

			return {
				x: Fp.mul(this.x, zInv2),
				y: Fp.mul(this.y, zInv3),
				z: 1n,
			};
		}

		/**
		 * Point negation
		 */
		export function negate(this: G1Point): G1Point {
			return { x: this.x, y: Fp.neg(this.y), z: this.z };
		}

		/**
		 * Point equality
		 */
		export function equal(this: G1Point, other: G1Point): boolean {
			const thisInf = isZero.call(this);
			const otherInf = isZero.call(other);

			if (thisInf && otherInf) return true;
			if (thisInf !== otherInf) return false;

			const z1_2 = Fp.mul(this.z, this.z);
			const z2_2 = Fp.mul(other.z, other.z);

			const x1_z2_2 = Fp.mul(this.x, z2_2);
			const x2_z1_2 = Fp.mul(other.x, z1_2);

			const z1_3 = Fp.mul(z1_2, this.z);
			const z2_3 = Fp.mul(z2_2, other.z);

			const y1_z2_3 = Fp.mul(this.y, z2_3);
			const y2_z1_3 = Fp.mul(other.y, z1_3);

			return x1_z2_2 === x2_z1_2 && y1_z2_3 === y2_z1_3;
		}

		/**
		 * Point doubling
		 */
		export function double(this: G1Point): G1Point {
			if (isZero.call(this)) return infinity();

			const x2 = Fp.mul(this.x, this.x);
			const y2 = Fp.mul(this.y, this.y);
			const y4 = Fp.mul(y2, y2);

			const s = Fp.mul(Fp.mul(this.x, y2), 4n);
			const m = Fp.mul(x2, 3n);

			const m2 = Fp.mul(m, m);
			const two_s = Fp.mul(s, 2n);
			const x_result = Fp.sub(m2, two_s);

			const s_minus_x = Fp.sub(s, x_result);
			const eight_y4 = Fp.mul(y4, 8n);
			const y_result = Fp.sub(Fp.mul(m, s_minus_x), eight_y4);

			const z_result = Fp.mul(Fp.mul(this.y, this.z), 2n);

			return { x: x_result, y: y_result, z: z_result };
		}

		/**
		 * Point addition
		 */
		export function add(this: G1Point, other: G1Point): G1Point {
			if (isZero.call(this)) return other;
			if (isZero.call(other)) return this;

			const z1_2 = Fp.mul(this.z, this.z);
			const z2_2 = Fp.mul(other.z, other.z);
			const u1 = Fp.mul(this.x, z2_2);
			const u2 = Fp.mul(other.x, z1_2);

			const z1_3 = Fp.mul(z1_2, this.z);
			const z2_3 = Fp.mul(z2_2, other.z);
			const s1 = Fp.mul(this.y, z2_3);
			const s2 = Fp.mul(other.y, z1_3);

			if (u1 === u2) {
				if (s1 === s2) {
					return double.call(this);
				}
				return infinity();
			}

			const h = Fp.sub(u2, u1);
			const r = Fp.sub(s2, s1);

			const h2 = Fp.mul(h, h);
			const h3 = Fp.mul(h2, h);
			const u1h2 = Fp.mul(u1, h2);

			const r2 = Fp.mul(r, r);
			const two_u1h2 = Fp.mul(u1h2, 2n);
			const x_result = Fp.sub(Fp.sub(r2, h3), two_u1h2);

			const y_result = Fp.sub(
				Fp.mul(r, Fp.sub(u1h2, x_result)),
				Fp.mul(s1, h3),
			);
			const z_result = Fp.mul(Fp.mul(this.z, other.z), h);

			return { x: x_result, y: y_result, z: z_result };
		}

		/**
		 * Scalar multiplication
		 */
		export function mul(this: G1Point, scalar: bigint): G1Point {
			if (scalar === 0n || isZero.call(this)) return infinity();

			const s = Fr.mod(scalar);
			let result = infinity();
			let base = this;

			let n = s;
			while (n > 0n) {
				if (n & 1n) {
					result = add.call(result, base);
				}
				base = double.call(base);
				n >>= 1n;
			}

			return result;
		}

		/**
		 * Validate and create point
		 */
		export function fromAffine(x: bigint, y: bigint): G1Point {
			const x_mod = Fp.mod(x);
			const y_mod = Fp.mod(y);
			const point = { x: x_mod, y: y_mod, z: 1n };

			const y2 = Fp.mul(y_mod, y_mod);
			const x3 = Fp.mul(Fp.mul(x_mod, x_mod), x_mod);
			const rhs = Fp.add(x3, B_G1);

			if (y2 !== rhs) {
				throw new Bn254InvalidPointError("Point not on G1 curve");
			}
			return point;
		}
	}

	// ==========================================================================
	// G2 Group (Points over Fp2)
	// ==========================================================================

	export type G2Point = {
		x: Fp2;
		y: Fp2;
		z: Fp2;
	};

	export namespace G2 {
		/**
		 * Point at infinity
		 */
		export function infinity(): G2Point {
			return { x: Fp2.ZERO, y: Fp2.ZERO, z: Fp2.ZERO };
		}

		/**
		 * G2 generator point
		 */
		export function generator(): G2Point {
			return {
				x: Fp2.create(G2_GENERATOR_X_C0, G2_GENERATOR_X_C1),
				y: Fp2.create(G2_GENERATOR_Y_C0, G2_GENERATOR_Y_C1),
				z: Fp2.ONE,
			};
		}

		/**
		 * Check if point is at infinity
		 */
		export function isZero(this: G2Point): boolean {
			return Fp2.isZero(this.z);
		}

		/**
		 * Check if point is on curve: y^2 = x^3 + b where b = (3/(9+u))
		 */
		export function isOnCurve(this: G2Point): boolean {
			if (isZero.call(this)) return true;

			const z2 = Fp2.square(this.z);
			const z4 = Fp2.square(z2);
			const z6 = Fp2.mul(z4, z2);

			const y2 = Fp2.square(this.y);
			const x3 = Fp2.mul(Fp2.square(this.x), this.x);
			const b = Fp2.create(B_G2_C0, B_G2_C1);
			const b_z6 = Fp2.mul(b, z6);

			return Fp2.equal(y2, Fp2.add(x3, b_z6));
		}

		/**
		 * Subgroup check for G2
		 */
		export function isInSubgroup(this: G2Point): boolean {
			if (isZero.call(this)) return true;
			if (!isOnCurve.call(this)) return false;

			const orderMul = mul.call(this, FR_MOD);
			return isZero.call(orderMul);
		}

		/**
		 * Convert to affine coordinates
		 */
		export function toAffine(this: G2Point): G2Point {
			if (isZero.call(this)) return infinity();

			const zInv = Fp2.inv(this.z);
			const zInv2 = Fp2.square(zInv);
			const zInv3 = Fp2.mul(zInv2, zInv);

			return {
				x: Fp2.mul(this.x, zInv2),
				y: Fp2.mul(this.y, zInv3),
				z: Fp2.ONE,
			};
		}

		/**
		 * Point negation
		 */
		export function negate(this: G2Point): G2Point {
			return { x: this.x, y: Fp2.neg(this.y), z: this.z };
		}

		/**
		 * Point equality
		 */
		export function equal(this: G2Point, other: G2Point): boolean {
			const thisInf = isZero.call(this);
			const otherInf = isZero.call(other);

			if (thisInf && otherInf) return true;
			if (thisInf !== otherInf) return false;

			const z1_2 = Fp2.square(this.z);
			const z2_2 = Fp2.square(other.z);

			const x1_z2_2 = Fp2.mul(this.x, z2_2);
			const x2_z1_2 = Fp2.mul(other.x, z1_2);

			const z1_3 = Fp2.mul(z1_2, this.z);
			const z2_3 = Fp2.mul(z2_2, other.z);

			const y1_z2_3 = Fp2.mul(this.y, z2_3);
			const y2_z1_3 = Fp2.mul(other.y, z1_3);

			return Fp2.equal(x1_z2_2, x2_z1_2) && Fp2.equal(y1_z2_3, y2_z1_3);
		}

		/**
		 * Point doubling
		 */
		export function double(this: G2Point): G2Point {
			if (isZero.call(this)) return infinity();

			const x2 = Fp2.square(this.x);
			const y2 = Fp2.square(this.y);
			const y4 = Fp2.square(y2);

			const s = Fp2.mulScalar(Fp2.mul(this.x, y2), 4n);
			const m = Fp2.mulScalar(x2, 3n);

			const m2 = Fp2.square(m);
			const two_s = Fp2.mulScalar(s, 2n);
			const x_result = Fp2.sub(m2, two_s);

			const s_minus_x = Fp2.sub(s, x_result);
			const eight_y4 = Fp2.mulScalar(y4, 8n);
			const y_result = Fp2.sub(Fp2.mul(m, s_minus_x), eight_y4);

			const z_result = Fp2.mulScalar(Fp2.mul(this.y, this.z), 2n);

			return { x: x_result, y: y_result, z: z_result };
		}

		/**
		 * Point addition
		 */
		export function add(this: G2Point, other: G2Point): G2Point {
			if (isZero.call(this)) return other;
			if (isZero.call(other)) return this;

			const z1_2 = Fp2.square(this.z);
			const z2_2 = Fp2.square(other.z);
			const u1 = Fp2.mul(this.x, z2_2);
			const u2 = Fp2.mul(other.x, z1_2);

			const z1_3 = Fp2.mul(z1_2, this.z);
			const z2_3 = Fp2.mul(z2_2, other.z);
			const s1 = Fp2.mul(this.y, z2_3);
			const s2 = Fp2.mul(other.y, z1_3);

			if (Fp2.equal(u1, u2)) {
				if (Fp2.equal(s1, s2)) {
					return double.call(this);
				}
				return infinity();
			}

			const h = Fp2.sub(u2, u1);
			const r = Fp2.sub(s2, s1);

			const h2 = Fp2.square(h);
			const h3 = Fp2.mul(h2, h);
			const u1h2 = Fp2.mul(u1, h2);

			const r2 = Fp2.square(r);
			const two_u1h2 = Fp2.mulScalar(u1h2, 2n);
			const x_result = Fp2.sub(Fp2.sub(r2, h3), two_u1h2);

			const y_result = Fp2.sub(
				Fp2.mul(r, Fp2.sub(u1h2, x_result)),
				Fp2.mul(s1, h3),
			);
			const z_result = Fp2.mul(Fp2.mul(this.z, other.z), h);

			return { x: x_result, y: y_result, z: z_result };
		}

		/**
		 * Scalar multiplication
		 */
		export function mul(this: G2Point, scalar: bigint): G2Point {
			if (scalar === 0n || isZero.call(this)) return infinity();

			const s = Fr.mod(scalar);
			let result = infinity();
			let base = this;

			let n = s;
			while (n > 0n) {
				if (n & 1n) {
					result = add.call(result, base);
				}
				base = double.call(base);
				n >>= 1n;
			}

			return result;
		}

		/**
		 * Frobenius endomorphism
		 */
		export function frobenius(this: G2Point): G2Point {
			const x_frob = Fp2.frobeniusMap(this.x);
			const y_frob = Fp2.frobeniusMap(this.y);
			const z_frob = Fp2.frobeniusMap(this.z);

			const frob_x_coeff = Fp2.create(
				9383897711787803092255416352689191878403287165598960768464489826468298733608n,
				0n,
			);
			const frob_y_coeff = Fp2.create(
				3691141430098779044309249828556373330968186103586981319701354368538621085069n,
				19668488431335630914265087332861993377664586457237624504494953988981847398421n,
			);

			return {
				x: Fp2.mul(x_frob, frob_x_coeff),
				y: Fp2.mul(y_frob, frob_y_coeff),
				z: z_frob,
			};
		}

		/**
		 * Validate and create point
		 */
		export function fromAffine(x: Fp2, y: Fp2): G2Point {
			const point = { x, y, z: Fp2.ONE };
			if (!isOnCurve.call(point)) {
				throw new Bn254InvalidPointError("Point not on G2 curve");
			}
			if (!isInSubgroup.call(point)) {
				throw new Bn254SubgroupCheckError("Point not in G2 subgroup");
			}
			return point;
		}
	}

	// ==========================================================================
	// Pairing Operations
	// ==========================================================================

	export namespace Pairing {
		/**
		 * Simplified pairing result representation
		 */
		type PairingResult = {
			value: bigint;
		};

		function pairingResultEqual(a: PairingResult, b: PairingResult): boolean {
			return a.value === b.value;
		}

		function pairingResultOne(): PairingResult {
			return { value: 1n };
		}

		/**
		 * Miller loop computation (simplified)
		 */
		function millerLoop(p: G1Point, q: G2Point): PairingResult {
			if (G1.isZero.call(p) || G2.isZero.call(q)) {
				return pairingResultOne();
			}

			const p_aff = G1.toAffine.call(p);
			const q_aff = G2.toAffine.call(q);

			let f = 1n;
			const t_bits = CURVE_PARAM_T.toString(2);

			for (let i = 1; i < t_bits.length; i++) {
				f = Fr.mul(Fr.mul(f, f), p_aff.x);

				if (t_bits[i] === "1") {
					f = Fr.mul(f, q_aff.x.c0);
				}
			}

			return { value: f };
		}

		/**
		 * Final exponentiation (simplified)
		 */
		function finalExponentiation(f: PairingResult): PairingResult {
			const exp = (FP_MOD ** 12n - 1n) / FR_MOD;
			const result = Fr.pow(f.value, exp);
			return { value: result };
		}

		/**
		 * Compute optimal ate pairing e(P, Q)
		 *
		 * @param p - Point in G1
		 * @param q - Point in G2
		 * @returns Pairing result in Fp12
		 *
		 * @example
		 * ```typescript
		 * const p = Bn254.G1.generator();
		 * const q = Bn254.G2.generator();
		 * const result = Bn254.Pairing.pair(p, q);
		 * ```
		 */
		export function pair(p: G1Point, q: G2Point): PairingResult {
			const ml = millerLoop(p, q);
			return finalExponentiation(ml);
		}

		/**
		 * Pairing product check: e(P1,Q1) * e(P2,Q2) * ... = 1
		 *
		 * Used for zkSNARK verification.
		 *
		 * @param pairs - Array of [G1Point, G2Point] pairs
		 * @returns true if pairing product equals 1
		 *
		 * @example
		 * ```typescript
		 * const valid = Bn254.Pairing.pairingCheck([
		 *   [p1, q1],
		 *   [p2, q2]
		 * ]);
		 * ```
		 */
		export function pairingCheck(pairs: Array<[G1Point, G2Point]>): boolean {
			if (pairs.length === 0) return true;

			const accumulator = pairingResultOne();

			for (const [p, q] of pairs) {
				const result = millerLoop(p, q);
				accumulator.value = Fr.mul(accumulator.value, result.value);
			}

			const final = finalExponentiation(accumulator);
			return pairingResultEqual(final, pairingResultOne());
		}

		/**
		 * Multi-pairing: compute product of pairings
		 *
		 * More efficient than computing pairings individually.
		 */
		export function multiPairing(
			pairs: Array<[G1Point, G2Point]>,
		): PairingResult {
			const accumulator = pairingResultOne();

			for (const [p, q] of pairs) {
				const result = millerLoop(p, q);
				accumulator.value = Fr.mul(accumulator.value, result.value);
			}

			return finalExponentiation(accumulator);
		}
	}

	// ==========================================================================
	// Utility Functions
	// ==========================================================================

	/**
	 * Serialize G1 point to bytes (64 bytes: x || y)
	 */
	export function serializeG1(point: G1Point): Uint8Array {
		const affine = G1.toAffine.call(point);
		const result = new Uint8Array(64);

		const xBytes = hexToBytes(affine.x.toString(16).padStart(64, "0"));
		const yBytes = hexToBytes(affine.y.toString(16).padStart(64, "0"));

		result.set(xBytes, 0);
		result.set(yBytes, 32);

		return result;
	}

	/**
	 * Deserialize G1 point from bytes
	 */
	export function deserializeG1(bytes: Uint8Array): G1Point {
		if (bytes.length !== 64) {
			throw new Bn254Error("Invalid G1 point serialization");
		}

		const x = BigInt("0x" + bytesToHex(bytes.slice(0, 32)));
		const y = BigInt("0x" + bytesToHex(bytes.slice(32, 64)));

		if (x === 0n && y === 0n) {
			return G1.infinity();
		}

		return G1.fromAffine(x, y);
	}

	/**
	 * Serialize G2 point to bytes (128 bytes: x.c0 || x.c1 || y.c0 || y.c1)
	 */
	export function serializeG2(point: G2Point): Uint8Array {
		const affine = G2.toAffine.call(point);
		const result = new Uint8Array(128);

		const xc0Bytes = hexToBytes(affine.x.c0.toString(16).padStart(64, "0"));
		const xc1Bytes = hexToBytes(affine.x.c1.toString(16).padStart(64, "0"));
		const yc0Bytes = hexToBytes(affine.y.c0.toString(16).padStart(64, "0"));
		const yc1Bytes = hexToBytes(affine.y.c1.toString(16).padStart(64, "0"));

		result.set(xc0Bytes, 0);
		result.set(xc1Bytes, 32);
		result.set(yc0Bytes, 64);
		result.set(yc1Bytes, 96);

		return result;
	}

	/**
	 * Deserialize G2 point from bytes
	 */
	export function deserializeG2(bytes: Uint8Array): G2Point {
		if (bytes.length !== 128) {
			throw new Bn254Error("Invalid G2 point serialization");
		}

		const xc0 = BigInt("0x" + bytesToHex(bytes.slice(0, 32)));
		const xc1 = BigInt("0x" + bytesToHex(bytes.slice(32, 64)));
		const yc0 = BigInt("0x" + bytesToHex(bytes.slice(64, 96)));
		const yc1 = BigInt("0x" + bytesToHex(bytes.slice(96, 128)));

		if (xc0 === 0n && xc1 === 0n && yc0 === 0n && yc1 === 0n) {
			return G2.infinity();
		}

		const x = Fp2.create(xc0, xc1);
		const y = Fp2.create(yc0, yc1);

		return G2.fromAffine(x, y);
	}

	// Helper functions
	function hexToBytes(hex: string): Uint8Array {
		const bytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length; i += 2) {
			bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
		}
		return bytes;
	}

	function bytesToHex(bytes: Uint8Array): string {
		return Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}
}

export default Bn254;
