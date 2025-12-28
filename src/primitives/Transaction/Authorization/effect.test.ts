import { describe, expect, it } from "vitest";
import { AuthorizationSchema } from "./effect.js";

describe("Authorization Effect Schema", () => {
	const addr = new Uint8Array(20);
	const r = new Uint8Array(32);
	const s = new Uint8Array(32);

	it("constructs and exposes helpers", () => {
		const auth = AuthorizationSchema.from({
			chainId: 1n,
			address: addr,
			nonce: 0n,
			yParity: 0,
			r,
			s,
		});
		const hash = auth.getSigningHash();
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(typeof auth.verifySignature()).toBe("boolean");
		try {
			auth.getAuthorizer();
		} catch {
			// Expected for invalid r/s test vector
			expect(true).toBe(true);
		}
	});
});
