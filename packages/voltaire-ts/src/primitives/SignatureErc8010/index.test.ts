import { Authorization, Secp256k1 } from "ox";
import { SignatureErc8010 as OxSignatureErc8010 } from "ox/erc8010";
import { describe, expect, it } from "vitest";
import * as SignatureErc8010 from "./index.js";

const address = "0x0000000000000000000000000000000000000001";
const to = "0x0000000000000000000000000000000000000002";
const unsigned = { address, chainId: 1, nonce: 2n } as const;
const authorization = {
	...unsigned,
	...Secp256k1.sign({
		payload: Authorization.getSignPayload(unsigned),
		privateKey:
			"0x0000000000000000000000000000000000000000000000000000000000000001",
	}),
};
const signature = "0x1234AB";

describe("SignatureErc8010", () => {
	it.each([{ data: "0xabcdef", to }, { data: "0xabcdef" }, {}] as const)(
		"matches ox/erc8010 with options %j",
		(options) => {
			const value = { authorization, signature, ...options } as const;
			const wrapped = OxSignatureErc8010.wrap(value);

			expect(SignatureErc8010.wrap(value)).toBe(wrapped);
			expect(SignatureErc8010.validate(wrapped)).toBe(true);
			expect(SignatureErc8010.unwrap(wrapped)).toEqual(
				OxSignatureErc8010.unwrap(wrapped),
			);
		},
	);

	it("detects the ERC-8010 marker and rejects malformed envelopes when parsing", () => {
		const marker = OxSignatureErc8010.magicBytes;
		expect(SignatureErc8010.validate(signature)).toBe(false);
		expect(SignatureErc8010.validate(`0xZ${marker.slice(2)}`)).toBe(false);
		expect(SignatureErc8010.validate(marker)).toBe(true);
		expect(() => SignatureErc8010.unwrap(marker)).toThrow();

		const oversized = `0x${"ff".repeat(32)}${marker.slice(2)}` as const;
		expect(() => SignatureErc8010.unwrap(oversized)).toThrow();
	});
});
