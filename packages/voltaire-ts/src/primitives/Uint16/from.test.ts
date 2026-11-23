import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("Uint16.from strict string grammar", () => {
	it.each([
		"12.5",
		"12xyz",
		"",
		" ",
		"   ",
		" 12",
		"12 ",
		"0x",
		"0xg1",
		"+5",
		"1e2",
		"--1",
		"-0x5",
	])("rejects %j", (input) => {
		expect(() => from(input)).toThrow("Invalid Uint16 string");
	});

	it("accepts decimal and 0x/0X hex", () => {
		expect(from("12")).toBe(12);
		expect(from("0")).toBe(0);
		expect(from("0xff")).toBe(255);
		expect(from("0XFF")).toBe(255);
		expect(from("007")).toBe(7);
	});

	it("negative decimal strings still report a range error", () => {
		expect(() => from("-1")).toThrow(/negative/);
	});
});
