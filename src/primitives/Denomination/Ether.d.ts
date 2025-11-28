import type { EtherType } from "./EtherType.js";
import type { WeiType } from "./WeiType.js";
import type { GweiType } from "./GweiType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Ether constructor - callable without new keyword
 */
export interface EtherConstructor {
	(value: bigint | number | string): Ether;
	from(value: bigint | number | string): Ether;
	fromWei(wei: WeiType): Ether;
	fromGwei(gwei: GweiType): Ether;
	toWei(ether: Ether): WeiType;
	toGwei(ether: Ether): GweiType;
	toU256(ether: Ether): Uint256Type;
}

/**
 * Ether instance type - a branded bigint representing ether amounts
 */
export type Ether = EtherType;
export declare const Ether: EtherConstructor;

export declare function from(value: bigint | number | string): Ether;
export declare function fromWei(wei: WeiType): Ether;
export declare function fromGwei(gwei: GweiType): Ether;
export declare function toWei(ether: Ether): WeiType;
export declare function toGwei(ether: Ether): GweiType;
export declare function toU256(ether: Ether): Uint256Type;

export default Ether;
