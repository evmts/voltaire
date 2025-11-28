import * as Uint from "../Uint/index.js";

/**
 * @typedef {import('./GweiType.js').GweiType} Gwei
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

/**
 * Creates a Gwei value from bigint, number, or string
 *
 * @param {bigint | number | string} value
 * @returns {Gwei}
 */
export function from(value) {
	return /** @type {Gwei} */ (Uint.from(value));
}

/**
 * Creates Gwei from Wei value
 *
 * @param {Wei} wei
 * @returns {Gwei}
 */
export function fromWei(wei) {
	const gwei = Uint.dividedBy(/** @type {Uint.Type} */ (wei), Uint.from(WEI_PER_GWEI));
	return /** @type {Gwei} */ (gwei);
}

/**
 * Creates Gwei from Ether value
 *
 * @param {Ether} ether
 * @returns {Gwei}
 */
export function fromEther(ether) {
	const gwei = Uint.times(/** @type {Uint.Type} */ (ether), Uint.from(GWEI_PER_ETHER));
	return /** @type {Gwei} */ (gwei);
}

/**
 * Converts Gwei to Wei
 *
 * @param {Gwei} gwei
 * @returns {Wei}
 */
export function toWei(gwei) {
	const wei = Uint.times(/** @type {Uint.Type} */ (gwei), Uint.from(WEI_PER_GWEI));
	return /** @type {Wei} */ (wei);
}

/**
 * Converts Gwei to Ether
 *
 * @param {Gwei} gwei
 * @returns {Ether}
 */
export function toEther(gwei) {
	const ether = Uint.dividedBy(/** @type {Uint.Type} */ (gwei), Uint.from(GWEI_PER_ETHER));
	return /** @type {Ether} */ (ether);
}

/**
 * Converts Gwei to Uint256
 *
 * @param {Gwei} gwei
 * @returns {Uint.Type}
 */
export function toU256(gwei) {
	return /** @type {Uint.Type} */ (gwei);
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
