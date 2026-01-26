import * as Schema from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as TypedData from "./index.js";

describe("TypedData.Struct", () => {
	describe("decode", () => {
		it("parses valid typed data", () => {
			const input = {
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
					],
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
				},
				primaryType: "Person",
				domain: { name: "My App", version: "1" },
				message: {
					name: "Bob",
					wallet: "0x1234567890123456789012345678901234567890",
				},
			};
			const result = Schema.decodeSync(TypedData.Struct)(input);
			expect(result.primaryType).toBe("Person");
			expect(result.domain.name).toBe("My App");
		});

		it("parses with chainId", () => {
			const input = {
				types: {
					EIP712Domain: [{ name: "chainId", type: "uint256" }],
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				domain: { chainId: "1" },
				message: { content: "Hello" },
			};
			const result = Schema.decodeSync(TypedData.Struct)(input);
			expect(result.domain.chainId).toBe(1);
		});
	});

	describe("encode", () => {
		it("encodes back to input format", () => {
			const input = {
				types: {
					EIP712Domain: [{ name: "name", type: "string" }],
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				domain: { name: "Test" },
				message: { content: "Hello" },
			};
			const decoded = Schema.decodeSync(TypedData.Struct)(input);
			const encoded = Schema.encodeSync(TypedData.Struct)(decoded);
			expect(encoded.primaryType).toBe("Message");
			expect(encoded.domain.name).toBe("Test");
		});
	});
});
