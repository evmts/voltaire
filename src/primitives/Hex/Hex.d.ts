import type { BrandedHex } from "./BrandedHex/BrandedHex.js";

export function Hex(value: string | Uint8Array | BrandedHex): BrandedHex;
export namespace Hex {
	export function from(value: string | Uint8Array | BrandedHex): BrandedHex;
	export function fromBytes(value: Uint8Array): BrandedHex;
	export function fromNumber(value: number, size?: number): BrandedHex;
	export function fromBigInt(value: bigint, size?: number): BrandedHex;
	export function fromString(value: string): BrandedHex;
	export function fromBoolean(value: boolean): BrandedHex;
	export function isHex(value: unknown): value is BrandedHex;
	export function concat(...hexes: BrandedHex[]): BrandedHex;
	export function random(size: number): BrandedHex;
	export function zero(size: number): BrandedHex;
	export function validate(value: string): BrandedHex;
	export function toBytes(hex: BrandedHex): Uint8Array;
	export function toNumber(hex: BrandedHex): number;
	export function toBigInt(hex: BrandedHex): bigint;
	export function toString(hex: BrandedHex): string;
	export function toBoolean(hex: BrandedHex): boolean;
	export function size(hex: BrandedHex): number;
	export function isSized<TSize extends number>(
		hex: BrandedHex,
		size: TSize,
	): boolean;
	export function assertSize<TSize extends number>(
		hex: BrandedHex,
		size: TSize,
	): void;
	export function slice(
		hex: BrandedHex,
		start?: number,
		end?: number,
	): BrandedHex;
	export function pad(hex: BrandedHex, size: number): BrandedHex;
	export function padRight(hex: BrandedHex, size: number): BrandedHex;
	export function trim(hex: BrandedHex): BrandedHex;
	export function equals(a: BrandedHex, b: BrandedHex): boolean;
	export function xor(a: BrandedHex, b: BrandedHex): BrandedHex;
}

export * from "./BrandedHex/errors.js";
export type { BrandedHex } from "./BrandedHex/BrandedHex.js";
