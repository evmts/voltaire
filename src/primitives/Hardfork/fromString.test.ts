/**
 * Tests for Hardfork.fromString
 */

import { describe, expect, it } from "vitest";
import { fromString } from "./fromString.js";
import * as Hardfork from "./index.js";

describe("Hardfork.fromString", () => {
	it("parses lowercase hardfork name", () => {
		const result = fromString("cancun");
		expect(result).toBe(Hardfork.CANCUN);
	});

	it("parses uppercase hardfork name", () => {
		const result = fromString("CANCUN");
		expect(result).toBe(Hardfork.CANCUN);
	});

	it("parses mixed case hardfork name", () => {
		const result = fromString("Cancun");
		expect(result).toBe(Hardfork.CANCUN);
	});

	it("parses berlin", () => {
		const result = fromString("berlin");
		expect(result).toBe(Hardfork.BERLIN);
	});

	it("parses london", () => {
		const result = fromString("london");
		expect(result).toBe(Hardfork.LONDON);
	});

	it("parses shanghai", () => {
		const result = fromString("shanghai");
		expect(result).toBe(Hardfork.SHANGHAI);
	});

	it("parses merge", () => {
		const result = fromString("merge");
		expect(result).toBe(Hardfork.MERGE);
	});

	it("parses paris as merge", () => {
		const result = fromString("paris");
		expect(result).toBe(Hardfork.MERGE);
	});

	it("parses frontier", () => {
		const result = fromString("frontier");
		expect(result).toBe(Hardfork.FRONTIER);
	});

	it("parses homestead", () => {
		const result = fromString("homestead");
		expect(result).toBe(Hardfork.HOMESTEAD);
	});

	it("parses tangerine whistle", () => {
		const result = fromString("tangerinewhistle");
		expect(result).toBe(Hardfork.TANGERINE_WHISTLE);
	});

	it("parses spurious dragon", () => {
		const result = fromString("spuriousdragon");
		expect(result).toBe(Hardfork.SPURIOUS_DRAGON);
	});

	it("parses byzantium", () => {
		const result = fromString("byzantium");
		expect(result).toBe(Hardfork.BYZANTIUM);
	});

	it("parses constantinople", () => {
		const result = fromString("constantinople");
		expect(result).toBe(Hardfork.CONSTANTINOPLE);
	});

	it("parses istanbul", () => {
		const result = fromString("istanbul");
		expect(result).toBe(Hardfork.ISTANBUL);
	});

	it("parses prague", () => {
		const result = fromString("prague");
		expect(result).toBe(Hardfork.PRAGUE);
	});

	it("handles comparison prefix >=", () => {
		const result = fromString(">=cancun");
		expect(result).toBe(Hardfork.CANCUN);
	});

	it("handles comparison prefix >", () => {
		const result = fromString(">berlin");
		expect(result).toBe(Hardfork.BERLIN);
	});

	it("handles comparison prefix <=", () => {
		const result = fromString("<=london");
		expect(result).toBe(Hardfork.LONDON);
	});

	it("handles comparison prefix <", () => {
		const result = fromString("<shanghai");
		expect(result).toBe(Hardfork.SHANGHAI);
	});

	it("returns undefined for invalid hardfork name", () => {
		const result = fromString("unknown");
		expect(result).toBeUndefined();
	});

	it("returns undefined for empty string", () => {
		const result = fromString("");
		expect(result).toBeUndefined();
	});

	it("returns undefined for random string", () => {
		const result = fromString("foobar");
		expect(result).toBeUndefined();
	});
});
