import type { Uint256Type } from "../Uint/Uint256Type.js";
import type { EtherType } from "./EtherType.js";
import type { Gwei } from "./Gwei.js";
import type { WeiType } from "./WeiType.js";

/**
 * Ether constructor - callable without new keyword
 */
export interface EtherConstructor {
	(value: bigint | number | string): Ether;
	from(value: bigint | number | string): Ether;
	fromWei(wei: WeiType): Ether;
	fromGwei(gwei: Gwei): Ether;
	toWei(ether: Ether): WeiType;
	toGwei(ether: Ether): Gwei;
	toU256(ether: Ether): Uint256Type;
}

/**
 * Ether instance type - a branded bigint representing ether amounts
 */
export type Ether = EtherType;
export declare const Ether: EtherConstructor;

export declare function from(value: bigint | number | string): Ether;
export declare function fromWei(wei: WeiType): Ether;
export declare function fromGwei(gwei: Gwei): Ether;
export declare function toWei(ether: Ether): WeiType;
export declare function toGwei(ether: Ether): Gwei;
export declare function toU256(ether: Ether): Uint256Type;

export default Ether;
