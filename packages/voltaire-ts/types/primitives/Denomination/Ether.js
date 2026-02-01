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
const WEI_PER_ETHER = 1000000000000000000n;
const GWEI_PER_ETHER = 1000000000n;
const DECIMALS = 18;
/**
 * Creates an Ether value from bigint, number, or string
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {bigint | number | string} value
 * @returns {Ether}
 */
export function from(value) {
    if (typeof value === "bigint") {
        return /** @type {Ether} */ (value.toString());
    }
    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            throw new Error(`Invalid Ether value: ${value}`);
        }
        return /** @type {Ether} */ (value.toString());
    }
    // string - validate it's a valid number
    const trimmed = value.trim();
    if (trimmed === "" || Number.isNaN(Number(trimmed))) {
        throw new Error(`Invalid Ether value: ${value}`);
    }
    return /** @type {Ether} */ (trimmed);
}
/**
 * Creates Ether from Wei value
 * Returns a string with proper decimal representation
 *
 * @param {Wei} wei
 * @returns {Ether}
 */
export function fromWei(wei) {
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
const GWEI_DECIMALS = 9;
/**
 * Creates Ether from Gwei value
 * Returns a string with proper decimal representation
 *
 * @param {Gwei} gwei
 * @returns {Ether}
 */
export function fromGwei(gwei) {
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
 * Converts Ether to Wei
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {Ether} ether
 * @returns {Wei}
 */
export function toWei(ether) {
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
 * Converts Ether to Gwei
 * Supports decimal strings like "1.5" or "0.001"
 *
 * @param {Ether} ether
 * @returns {Gwei}
 */
export function toGwei(ether) {
    const str = String(ether);
    const [intPart, decPart = ""] = str.split(".");
    if (decPart.length > GWEI_DECIMALS) {
        throw new Error(`Ether value has too many decimal places for Gwei conversion (max ${GWEI_DECIMALS}): ${ether}`);
    }
    // Pad decimal part to 9 digits (gwei has 9 decimal places)
    const paddedDec = decPart.padEnd(GWEI_DECIMALS, "0");
    // Combine integer and decimal parts
    const combined = intPart + paddedDec;
    // Remove leading zeros and convert to bigint
    const gwei = BigInt(combined.replace(/^0+/, "") || "0");
    return /** @type {Gwei} */ ( /** @type {unknown} */(gwei));
}
/**
 * Converts Ether to Uint256 (as Wei)
 * Parses decimal strings and returns the Wei value as Uint256
 *
 * @param {Ether} ether
 * @returns {Uint.Type}
 */
export function toU256(ether) {
    // Convert to Wei first (which handles decimals), then cast to Uint
    const wei = toWei(ether);
    return /** @type {Uint.Type} */ ( /** @type {unknown} */(wei));
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
