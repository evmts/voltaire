import * as Uint from "../Uint/index.js";

/**
 * @typedef {import('./EtherType.js').EtherType} Ether
 * @typedef {import('./Wei.js').Wei} Wei
 * @typedef {import('./Gwei.js').Gwei} Gwei
 */

/**
 * @typedef {Object} EtherConstructorStatic
 * @property {typeof from} from
 * @property {typeof fromWei} fromWei
 * @property {typeof fromGwei} fromGwei
 * @property {typeof toWei} toWei
 * @property {typeof toGwei} toGwei
 * @property {typeof toU256} toU256
 */

/**
 * @typedef {((value: bigint | number | string) => Ether) & EtherConstructorStatic} EtherConstructor
 */

const WEI_PER_ETHER = 1_000_000_000_000_000_000n;
const GWEI_PER_ETHER = 1_000_000_000n;

/**
 * Creates an Ether value from bigint, number, or string
 *
 * @param {bigint | number | string} value
 * @returns {Ether}
 */
export function from(value) {
	return /** @type {Ether} */ (Uint.from(value));
}

/**
 * Creates Ether from Wei value
 *
 * @param {Wei} wei
 * @returns {Ether}
 */
export function fromWei(wei) {
	const ether = Uint.dividedBy(/** @type {Uint.Type} */ (wei), Uint.from(WEI_PER_ETHER));
	return /** @type {Ether} */ (ether);
}

/**
 * Creates Ether from Gwei value
 *
 * @param {Gwei} gwei
 * @returns {Ether}
 */
export function fromGwei(gwei) {
	const ether = Uint.dividedBy(/** @type {Uint.Type} */ (gwei), Uint.from(GWEI_PER_ETHER));
	return /** @type {Ether} */ (ether);
}

/**
 * Converts Ether to Wei
 *
 * @param {Ether} ether
 * @returns {Wei}
 */
export function toWei(ether) {
	const wei = Uint.times(/** @type {Uint.Type} */ (ether), Uint.from(WEI_PER_ETHER));
	return /** @type {Wei} */ (wei);
}

/**
 * Converts Ether to Gwei
 *
 * @param {Ether} ether
 * @returns {Gwei}
 */
export function toGwei(ether) {
	const gwei = Uint.times(/** @type {Uint.Type} */ (ether), Uint.from(GWEI_PER_ETHER));
	return /** @type {Gwei} */ (gwei);
}

/**
 * Converts Ether to Uint256
 *
 * @param {Ether} ether
 * @returns {Uint.Type}
 */
export function toU256(ether) {
	return /** @type {Uint.Type} */ (ether);
}

/**
 * Ether constructor and namespace
 * @type {EtherConstructor}
 */
export const Ether = Object.assign(from, {
	from,
	fromWei,
	fromGwei,
	toWei,
	toGwei,
	toU256,
});

export default Ether;
