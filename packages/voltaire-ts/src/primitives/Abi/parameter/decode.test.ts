/**
 * Unit tests for decode function
 */

import { describe, expect, it } from "vitest";
import { AbiDecodingError } from "../Errors.js";
import { decode } from "./decode.js";

describe("decode", () => {
	it("always throws AbiDecodingError", () => {
		const param = { type: "uint256", name: "amount" };
		const data = new Uint8Array(32);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws with correct error message", () => {
		const param = { type: "address", name: "to" };
		const data = new Uint8Array(32);
		expect(() => decode.call(param, data)).toThrow(
			"Parameter.decode is not implemented. Use Abi.decodeParameters instead.",
		);
	});

	it("throws regardless of parameter type - uint256", () => {
		const param = { type: "uint256" };
		const data = new Uint8Array(32);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws regardless of parameter type - address", () => {
		const param = { type: "address" };
		const data = new Uint8Array(32);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws regardless of parameter type - bool", () => {
		const param = { type: "bool" };
		const data = new Uint8Array(32);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws regardless of parameter type - string", () => {
		const param = { type: "string" };
		const data = new Uint8Array(64);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws regardless of parameter type - bytes", () => {
		const param = { type: "bytes" };
		const data = new Uint8Array(64);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws regardless of parameter type - array", () => {
		const param = { type: "uint256[]" };
		const data = new Uint8Array(96);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws regardless of parameter type - tuple", () => {
		const param = {
			type: "tuple",
			components: [
				{ type: "address", name: "addr" },
				{ type: "uint256", name: "value" },
			],
		};
		const data = new Uint8Array(64);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws with empty data", () => {
		const param = { type: "uint256" };
		const data = new Uint8Array(0);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws with invalid data size", () => {
		const param = { type: "uint256" };
		const data = new Uint8Array(16); // Too small
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});

	it("throws even with large valid-looking data", () => {
		const param = { type: "uint256" };
		const data = new Uint8Array(1000);
		expect(() => decode.call(param, data)).toThrow(AbiDecodingError);
	});
});
