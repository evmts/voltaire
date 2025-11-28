import type { GweiType } from "./GweiType.js";
import type { WeiType } from "./WeiType.js";
import type { EtherType } from "./EtherType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Gwei constructor - callable without new keyword
 */
export interface GweiConstructor {
	(value: bigint | number | string): Gwei;
	from(value: bigint | number | string): Gwei;
	fromWei(wei: WeiType): Gwei;
	fromEther(ether: EtherType): Gwei;
	toWei(gwei: Gwei): WeiType;
	toEther(gwei: Gwei): EtherType;
	toU256(gwei: Gwei): Uint256Type;
}

/**
 * Gwei instance type - a branded bigint representing gwei amounts
 */
export type Gwei = GweiType;
export declare const Gwei: GweiConstructor;

export declare function from(value: bigint | number | string): Gwei;
export declare function fromWei(wei: WeiType): Gwei;
export declare function fromEther(ether: EtherType): Gwei;
export declare function toWei(gwei: Gwei): WeiType;
export declare function toEther(gwei: Gwei): EtherType;
export declare function toU256(gwei: Gwei): Uint256Type;

export default Gwei;
