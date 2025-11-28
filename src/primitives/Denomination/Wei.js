import * as Uint from "../Uint/index.js";

/**
 * @typedef {import('./WeiType.js').WeiType} Wei
 * @typedef {import('./Gwei.js').Gwei} Gwei
 * @typedef {import('./Ether.js').Ether} Ether
 */

/**
 * @typedef {Object} WeiConstructorStatic
 * @property {typeof from} from
 * @property {typeof fromGwei} fromGwei
 * @property {typeof fromEther} fromEther
 * @property {typeof toGwei} toGwei
 * @property {typeof toEther} toEther
 * @property {typeof toU256} toU256
 */

/**
 * @typedef {((value: bigint | number | string) => Wei) & WeiConstructorStatic} WeiConstructor
 */

const WEI_PER_GWEI = 1_000_000_000n;
const WEI_PER_ETHER = 1_000_000_000_000_000_000n;

/**
 * Creates a Wei value from bigint, number, or string
 *
 * @param {bigint | number | string} value
 * @returns {Wei}
 */
export function from(value) {
	return /** @type {Wei} */ (Uint.from(value));
}

/**
 * Creates Wei from Gwei value
 *
 * @param {Gwei} gwei
 * @returns {Wei}
 */
export function fromGwei(gwei) {
	const wei = Uint.times(/** @type {Uint.Type} */ (gwei), Uint.from(WEI_PER_GWEI));
	return /** @type {Wei} */ (wei);
}

/**
 * Creates Wei from Ether value
 *
 * @param {Ether} ether
 * @returns {Wei}
 */
export function fromEther(ether) {
	const wei = Uint.times(/** @type {Uint.Type} */ (ether), Uint.from(WEI_PER_ETHER));
	return /** @type {Wei} */ (wei);
}

/**
 * Converts Wei to Gwei
 *
 * @param {Wei} wei
 * @returns {Gwei}
 */
export function toGwei(wei) {
	const gwei = Uint.dividedBy(/** @type {Uint.Type} */ (wei), Uint.from(WEI_PER_GWEI));
	return /** @type {Gwei} */ (gwei);
}

/**
 * Converts Wei to Ether
 *
 * @param {Wei} wei
 * @returns {Ether}
 */
export function toEther(wei) {
	const ether = Uint.dividedBy(/** @type {Uint.Type} */ (wei), Uint.from(WEI_PER_ETHER));
	return /** @type {Ether} */ (ether);
}

/**
 * Converts Wei to Uint256
 *
 * @param {Wei} wei
 * @returns {Uint.Type}
 */
export function toU256(wei) {
	return /** @type {Uint.Type} */ (wei);
}

/**
 * Wei constructor and namespace
 * @type {WeiConstructor}
 */
export const Wei = Object.assign(from, {
	from,
	fromGwei,
	fromEther,
	toGwei,
	toEther,
	toU256,
});

export default Wei;
