import type { HexType } from "./HexType/HexType.js";

export function Hex(value: string | Uint8Array | HexType): HexType;
export namespace Hex {
	export function from(value: string | Uint8Array | HexType): HexType;
	export function fromBytes(value: Uint8Array): HexType;
	export function fromNumber(value: number, size?: number): HexType;
	export function fromBigInt(value: bigint, size?: number): HexType;
	export function fromString(value: string): HexType;
	export function fromBoolean(value: boolean): HexType;
	export function isHex(value: unknown): value is HexType;
	export function concat(...hexes: HexType[]): HexType;
	export function random(size: number): HexType;
	export function zero(size: number): HexType;
	export function validate(value: string): HexType;
	export function toBytes(hex: HexType): Uint8Array;
	export function toNumber(hex: HexType): number;
	export function toBigInt(hex: HexType): bigint;
	export function toString(hex: HexType): string;
	export function toBoolean(hex: HexType): boolean;
	export function size(hex: HexType): number;
	export function isSized<TSize extends number>(
		hex: HexType,
		size: TSize,
	): boolean;
	export function assertSize<TSize extends number>(
		hex: HexType,
		size: TSize,
	): void;
	export function slice(hex: HexType, start?: number, end?: number): HexType;
	export function pad(hex: HexType, size: number): HexType;
	export function padRight(hex: HexType, size: number): HexType;
	export function trim(hex: HexType): HexType;
	export function equals(a: HexType, b: HexType): boolean;
	export function xor(a: HexType, b: HexType): HexType;
}

export * from "./HexType/errors.js";
export type { HexType } from "./HexType/HexType.js";
