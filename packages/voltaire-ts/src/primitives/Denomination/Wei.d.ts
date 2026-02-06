import type { Uint256Type } from "../Uint/Uint256Type.js";
import type { EtherType } from "./EtherType.js";
import type { GweiType } from "./GweiType.js";
import type { WeiType } from "./WeiType.js";

/**
 * Wei constructor - callable without new keyword
 */
export interface WeiConstructor {
	(value: bigint | number | string): Wei;
	from(value: bigint | number | string): Wei;
	fromGwei(gwei: GweiType): Wei;
	fromEther(ether: EtherType): Wei;
	toGwei(wei: Wei): GweiType;
	toEther(wei: Wei): EtherType;
	toU256(wei: Wei): Uint256Type;
}

/**
 * Wei instance type - a branded bigint representing wei amounts
 */
export type Wei = WeiType;
export declare const Wei: WeiConstructor;

export declare function from(value: bigint | number | string): Wei;
export declare function fromGwei(gwei: GweiType): Wei;
export declare function fromEther(ether: EtherType): Wei;
export declare function toGwei(wei: Wei): GweiType;
export declare function toEther(wei: Wei): EtherType;
export declare function toU256(wei: Wei): Uint256Type;

export default Wei;
