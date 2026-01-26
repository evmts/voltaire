import { describe, expect, it } from "@effect/vitest";
import * as Schema from "effect/Schema";
import * as FunctionSignature from "./index.js";

describe("FunctionSignature.String", () => {
	describe("decode", () => {
		it("parses ERC20 transfer", () => {
			const sig = Schema.decodeSync(FunctionSignature.String)(
				"transfer(address,uint256)",
			);
			expect(sig.name).toBe("transfer");
			expect(sig.signature).toBe("transfer(address,uint256)");
			expect(sig.selector).toBeInstanceOf(Uint8Array);
			expect(sig.selector.length).toBe(4);
		});

		it("parses balanceOf", () => {
			const sig = Schema.decodeSync(FunctionSignature.String)(
				"balanceOf(address)",
			);
			expect(sig.name).toBe("balanceOf");
		});
	});

	describe("encode", () => {
		it("encodes back to signature string", () => {
			const sig = Schema.decodeSync(FunctionSignature.String)(
				"transfer(address,uint256)",
			);
			const str = Schema.encodeSync(FunctionSignature.String)(sig);
			expect(str).toBe("transfer(address,uint256)");
		});
	});
});
