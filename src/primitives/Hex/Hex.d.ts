import type { HexType, Sized } from "./HexType.js";

export function Hex(value: string | Uint8Array | HexType): HexType;
export namespace Hex {
	export function from(value: string | Uint8Array | HexType): HexType;
	export function fromBytes(value: Uint8Array): HexType;
	export function fromNumber(value: number, size?: number): HexType;
	export function fromBigInt(value: bigint, size?: number): HexType;
	export function fromString(value: string): HexType;
	export function fromBoolean(value: boolean): Sized<1>;
	export function isHex(value: unknown): value is HexType;
	export function concat(...hexes: (HexType | string)[]): HexType;
	export function random(size: number): HexType;
	export function zero(size: number): HexType;
	export function validate(value: string): HexType;
	export function toBytes(hex: HexType | `0x${string}` | string): Uint8Array;
	export function toNumber(hex: HexType | string): number;
	export function toBigInt(hex: HexType | string): bigint;
	export function toString(hex: HexType | string): string;
	export function toBoolean(hex: HexType | string): boolean;
	export function size(hex: HexType | string): number;
	export function isSized<TSize extends number>(
		hex: HexType | string,
		size: TSize,
	): boolean;
	export function assertSize<TSize extends number>(
		hex: HexType | string,
		size: TSize,
	): void;
	export function slice(
		hex: HexType | string,
		start?: number,
		end?: number,
	): HexType;
	export function pad(hex: HexType | string, size: number): HexType;
	export function padRight(hex: HexType | string, size: number): HexType;
	export function trim(hex: HexType | string): HexType;
	export function equals(a: HexType | string, b: HexType | string): boolean;
	export function xor(a: HexType | string, b: HexType | string): HexType;
	export function clone(hex: HexType | string): HexType;
}

export const fromBytes: typeof Hex.fromBytes;
export const toBytes: typeof Hex.toBytes;

export * from "./errors.js";
export type { HexType, Sized, Bytes } from "./HexType.js";
