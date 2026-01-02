import { describe, it } from "vitest";
import type { Uint256Type } from "../Uint/Uint256Type.js";
import type { NonceType } from "./NonceType.js";

type Equals<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false;

describe("NonceType", () => {
	it("should be a branded Uint256Type", () => {
		// biome-ignore lint/suspicious/noExplicitAny: type-level test requires any cast
		const _typeTest = null as any as Equals<NonceType, Uint256Type>;
		const _assertion: Equals<typeof _typeTest, false> = true;
		_assertion;
	});

	it("should not accept plain bigint", () => {
		const plainBigint = 1n;
		// @ts-expect-error - plain bigint is not NonceType
		const _nonce: NonceType = plainBigint;
		_nonce;
	});

	it("should not accept number", () => {
		// @ts-expect-error - number is not NonceType
		const _nonce: NonceType = 1;
		_nonce;
	});

	it("should not accept string", () => {
		// @ts-expect-error - string is not NonceType
		const _nonce: NonceType = "1";
		_nonce;
	});

	it("should not accept Uint8Array", () => {
		// @ts-expect-error - Uint8Array is not NonceType
		const _nonce: NonceType = new Uint8Array([1]);
		_nonce;
	});

	it("should accept result from from constructor", () => {
		const nonce = 1n as NonceType;
		const _result: NonceType = nonce;
		_result;
	});
});
