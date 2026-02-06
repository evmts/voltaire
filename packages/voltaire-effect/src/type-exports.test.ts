/**
 * @fileoverview Tests verifying type exports are accessible from root module
 */
import { describe, it, expectTypeOf } from "vitest";
import type { AddressType, HexType, HashType, BrandedAddress, HexBrand, Sized } from "./index.js";

describe("root type exports", () => {
	it("AddressType is exported and usable", () => {
		const addr: AddressType = new Uint8Array(20) as AddressType;
		expectTypeOf(addr).toMatchTypeOf<Uint8Array>();
	});

	it("HexType is exported and usable", () => {
		const hex: HexType = "0xdeadbeef" as HexType;
		expectTypeOf(hex).toMatchTypeOf<string>();
	});

	it("HashType is exported and usable", () => {
		const hash: HashType = new Uint8Array(32) as HashType;
		expectTypeOf(hash).toMatchTypeOf<Uint8Array>();
	});

	it("BrandedAddress is exported", () => {
		type Test = BrandedAddress;
		expectTypeOf<Test>().not.toBeNever();
	});

	it("HexBrand is exported", () => {
		type Test = HexBrand;
		expectTypeOf<Test>().not.toBeNever();
	});

	it("Sized is exported", () => {
		type Test = Sized<32>;
		expectTypeOf<Test>().toMatchTypeOf<string>();
	});
});
