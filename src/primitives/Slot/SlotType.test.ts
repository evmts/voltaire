import { describe, it } from "vitest";
import type { SlotType } from "./SlotType.js";

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
	? 1
	: 2
	? true
	: false;

describe("SlotType", () => {
	it("should be a branded bigint type", () => {
		// biome-ignore lint/suspicious/noExplicitAny: type-level test requires any cast
		const _typeTest = null as any as Equals<SlotType, bigint>;
		const _assertion: Equals<typeof _typeTest, false> = true;
		_assertion;
	});

	it("should not accept plain bigint", () => {
		const plainBigint = 1n;
		// @ts-expect-error - plain bigint is not SlotType
		const _slot: SlotType = plainBigint;
		_slot;
	});

	it("should not accept number", () => {
		// @ts-expect-error - number is not SlotType
		const _slot: SlotType = 1;
		_slot;
	});

	it("should not accept string", () => {
		// @ts-expect-error - string is not SlotType
		const _slot: SlotType = "1";
		_slot;
	});

	it("should accept result from from constructor", () => {
		const slot = 1n as SlotType;
		const _result: SlotType = slot;
		_result;
	});
});
