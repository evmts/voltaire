import type { WeiType } from "./WeiType.js";
import type { GweiType } from "./GweiType.js";
import type { EtherType } from "./EtherType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

// Wei
export interface WeiConstructor {
	(value: bigint | number | string): Wei;
	from(value: bigint | number | string): Wei;
	fromGwei(gwei: Gwei): Wei;
	fromEther(ether: Ether): Wei;
	toGwei(wei: Wei): Gwei;
	toEther(wei: Wei): Ether;
	toU256(wei: Wei): Uint256Type;
}
export type Wei = WeiType;
export declare const Wei: WeiConstructor;

// Gwei
export interface GweiConstructor {
	(value: bigint | number | string): Gwei;
	from(value: bigint | number | string): Gwei;
	fromWei(wei: Wei): Gwei;
	fromEther(ether: Ether): Gwei;
	toWei(gwei: Gwei): Wei;
	toEther(gwei: Gwei): Ether;
	toU256(gwei: Gwei): Uint256Type;
}
export type Gwei = GweiType;
export declare const Gwei: GweiConstructor;

// Ether
export interface EtherConstructor {
	(value: bigint | number | string): Ether;
	from(value: bigint | number | string): Ether;
	fromWei(wei: Wei): Ether;
	fromGwei(gwei: Gwei): Ether;
	toWei(ether: Ether): Wei;
	toGwei(ether: Ether): Gwei;
	toU256(ether: Ether): Uint256Type;
}
export type Ether = EtherType;
export declare const Ether: EtherConstructor;

// Branded namespaces
export * as BrandedWeiNamespace from "./wei-index.js";
export * as BrandedGweiNamespace from "./gwei-index.js";
export * as BrandedEtherNamespace from "./ether-index.js";

// Type definitions
export type { EtherType, BrandedEther } from "./EtherType.js";
export type { GweiType, BrandedGwei } from "./GweiType.js";
export type { WeiType, BrandedWei } from "./WeiType.js";
