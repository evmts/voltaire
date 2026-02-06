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
const WEI_PER_GWEI = 1000000000n;
const WEI_PER_ETHER = 1000000000000000000n;
const DECIMALS = 18;
/**
 * Creates a Wei value from bigint, number, or string
 *
 * @param {bigint | number | string} value
 * @returns {Wei}
 */
export function from(value) {
    return /** @type {Wei} */ ( /** @type {unknown} */(Uint.from(value)));
}
/**
 * Creates Wei from Gwei value
 *
 * @param {Gwei} gwei
 * @returns {Wei}
 */
export function fromGwei(gwei) {
    const wei = Uint.times(
    /** @type {Uint.Type} */ ( /** @type {unknown} */(gwei)), Uint.from(WEI_PER_GWEI));
    return /** @type {Wei} */ ( /** @type {unknown} */(wei));
}
/**
 * Creates Wei from Ether value
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {Ether} ether
 * @returns {Wei}
 */
export function fromEther(ether) {
    const str = String(ether);
    const [intPart, decPart = ""] = str.split(".");
    if (decPart.length > DECIMALS) {
        throw new Error(`Ether value has too many decimal places (max ${DECIMALS}): ${ether}`);
    }
    // Pad decimal part to 18 digits
    const paddedDec = decPart.padEnd(DECIMALS, "0");
    // Combine integer and decimal parts
    const combined = intPart + paddedDec;
    // Remove leading zeros and convert to bigint
    const wei = BigInt(combined.replace(/^0+/, "") || "0");
    return /** @type {Wei} */ (wei);
}
/**
 * Converts Wei to Gwei
 *
 * @param {Wei} wei
 * @returns {Gwei}
 */
export function toGwei(wei) {
    const gwei = Uint.dividedBy(
    /** @type {Uint.Type} */ ( /** @type {unknown} */(wei)), Uint.from(WEI_PER_GWEI));
    return /** @type {Gwei} */ ( /** @type {unknown} */(gwei));
}
/**
 * Converts Wei to Ether
 * Returns a string with proper decimal representation
 *
 * @param {Wei} wei
 * @returns {Ether}
 */
export function toEther(wei) {
    const weiValue = BigInt(wei);
    const intPart = weiValue / WEI_PER_ETHER;
    const decPart = weiValue % WEI_PER_ETHER;
    if (decPart === 0n) {
        return /** @type {Ether} */ (intPart.toString());
    }
    // Convert decimal part to string with leading zeros
    const decStr = decPart.toString().padStart(DECIMALS, "0");
    // Remove trailing zeros
    const trimmedDec = decStr.replace(/0+$/, "");
    return /** @type {Ether} */ (`${intPart}.${trimmedDec}`);
}
/**
 * Converts Wei to Uint256
 *
 * @param {Wei} wei
 * @returns {Uint.Type}
 */
export function toU256(wei) {
    return /** @type {Uint.Type} */ ( /** @type {unknown} */(wei));
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
