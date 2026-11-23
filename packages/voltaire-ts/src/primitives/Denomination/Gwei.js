import * as Uint from "../Uint/index.js";
import { from as etherFrom, toGwei } from "./Ether.js";

/**
 * Whole-gwei amount stored as a bigint. The decimal-string `GweiType`
 * belongs to the `BrandedGwei` namespace (`gwei-index.js`), which supports
 * fractional gwei.
 *
 * @typedef {import('./Gwei.js').Gwei} Gwei
 * @typedef {import('./Wei.js').Wei} Wei
 * @typedef {import('./Ether.js').Ether} Ether
 */

/**
 * @typedef {Object} GweiConstructorStatic
 * @property {typeof from} from
 * @property {typeof fromWei} fromWei
 * @property {typeof fromEther} fromEther
 * @property {typeof toWei} toWei
 * @property {typeof toEther} toEther
 * @property {typeof toU256} toU256
 */

/**
 * @typedef {((value: bigint | number | string) => Gwei) & GweiConstructorStatic} GweiConstructor
 */

const WEI_PER_GWEI = 1_000_000_000n;
const GWEI_PER_ETHER = 1_000_000_000n;
const GWEI_DECIMALS = 9;

/**
 * Creates a whole Gwei value from bigint, number, or string
 *
 * @param {bigint | number | string} value - Non-negative whole gwei amount
 * @returns {Gwei}
 * @throws {Error} If value is negative, fractional, or not a Uint256
 */
export function from(value) {
	return /** @type {Gwei} */ (/** @type {unknown} */ (Uint.from(value)));
}

/**
 * Creates Gwei from Wei value
 *
 * Gwei here is a whole number, so the Wei amount must be a multiple of
 * 10^9. Use `BrandedGwei.fromWei` for fractional gwei.
 *
 * @param {Wei} wei
 * @returns {Gwei}
 * @throws {Error} If wei is not a whole number of gwei
 */
export function fromWei(wei) {
	if (BigInt(wei) % WEI_PER_GWEI !== 0n) {
		throw new Error(
			`Wei value is not a whole number of Gwei (would lose precision): ${wei}`,
		);
	}
	const gwei = Uint.dividedBy(
		/** @type {Uint.Type} */ (/** @type {unknown} */ (wei)),
		Uint.from(WEI_PER_GWEI),
	);
	return /** @type {Gwei} */ (/** @type {unknown} */ (gwei));
}

/**
 * Creates Gwei from Ether value
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {Ether} ether
 * @returns {Gwei}
 */
export function fromEther(ether) {
	return toGwei(etherFrom(ether));
}

/**
 * Converts Gwei to Wei
 *
 * @param {Gwei} gwei
 * @returns {Wei}
 * @throws {Error} If gwei is not a non-negative whole bigint or the result exceeds the Uint256 maximum
 */
export function toWei(gwei) {
	if (typeof gwei !== "bigint" || gwei < 0n) {
		throw new Error(`Gwei value must be a non-negative whole bigint: ${gwei}`);
	}
	const wei = gwei * WEI_PER_GWEI;
	if (wei > Uint.MAX) {
		throw new Error(`Gwei value exceeds Uint256 maximum in Wei: ${gwei}`);
	}
	return /** @type {Wei} */ (/** @type {unknown} */ (wei));
}

/**
 * Converts Gwei to Ether
 * Returns a string with proper decimal representation
 *
 * @param {Gwei} gwei
 * @returns {Ether}
 */
export function toEther(gwei) {
	const gweiValue = BigInt(gwei);
	const intPart = gweiValue / GWEI_PER_ETHER;
	const decPart = gweiValue % GWEI_PER_ETHER;

	if (decPart === 0n) {
		return /** @type {Ether} */ (intPart.toString());
	}

	// Convert decimal part to string with leading zeros
	const decStr = decPart.toString().padStart(GWEI_DECIMALS, "0");
	// Remove trailing zeros
	const trimmedDec = decStr.replace(/0+$/, "");
	return /** @type {Ether} */ (`${intPart}.${trimmedDec}`);
}

/**
 * Converts Gwei to Uint256
 *
 * @param {Gwei} gwei
 * @returns {Uint.Type}
 */
export function toU256(gwei) {
	return /** @type {Uint.Type} */ (/** @type {unknown} */ (gwei));
}

/**
 * Gwei constructor and namespace
 * @type {GweiConstructor}
 */
export const Gwei = Object.assign(from, {
	from,
	fromWei,
	fromEther,
	toWei,
	toEther,
	toU256,
});

export default Gwei;
