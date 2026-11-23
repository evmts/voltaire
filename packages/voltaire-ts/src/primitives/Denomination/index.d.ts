import type { Uint256Type } from "../Uint/Uint256Type.js";
import type { EtherType } from "./EtherType.js";
import type { WeiType } from "./WeiType.js";

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
export type Gwei = import("./Gwei.js").Gwei;
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

// Type definitions
export type { BrandedEther, EtherType } from "./EtherType.js";
export * as BrandedEtherNamespace from "./ether-index.js";
export type { BrandedGwei, GweiType } from "./GweiType.js";
export * as BrandedGweiNamespace from "./gwei-index.js";
export type { BrandedWei, WeiType } from "./WeiType.js";
// Branded namespaces
export * as BrandedWeiNamespace from "./wei-index.js";
