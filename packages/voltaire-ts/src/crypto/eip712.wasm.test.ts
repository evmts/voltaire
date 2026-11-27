import { describe, expect, it } from "vitest";
import { Address } from "../primitives/Address/index.js";
import { isWasmLoaded, unloadWasm } from "../wasm-loader/loader.js";
import type { TypedData } from "./EIP712/EIP712Type.js";
import { EIP712 } from "./EIP712/index.js";
import { Eip712Wasm } from "./eip712.wasm.js";
import { Keccak256Wasm } from "./keccak256.wasm.js";

const PRIVATE_KEY = new Uint8Array(32).fill(0x33);

const TYPED_DATA: TypedData = {
	domain: {
		name: "Ether Mail",
		version: "1",
		chainId: 1n,
		verifyingContract: Address.fromHex(
			"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
		),
	},
	types: {
		Person: [
			{ name: "name", type: "string" },
			{ name: "wallet", type: "address" },
		],
		Mail: [
			{ name: "from", type: "Person" },
			{ name: "to", type: "Person" },
			{ name: "contents", type: "string" },
		],
	},
	primaryType: "Mail",
	message: {
		from: {
			name: "Cow",
			wallet: Address.fromHex("0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"),
		},
		to: {
			name: "Bob",
			wallet: Address.fromHex("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"),
		},
		contents: "Hello, Bob!",
	},
};

describe("Eip712Wasm", () => {
	it("auto-initializes WASM and matches pure-JS EIP-712 hashing, signing, and recovery", () => {
		unloadWasm();
		Keccak256Wasm.reset();

		const hash = Eip712Wasm.hashTypedData(TYPED_DATA);
		expect(Keccak256Wasm.isReady()).toBe(true);
		expect(hash).toEqual(EIP712.hashTypedData(TYPED_DATA));

		const sig = Eip712Wasm.signTypedData(TYPED_DATA, PRIVATE_KEY);
		expect(isWasmLoaded()).toBe(true);

		const recovered = Eip712Wasm.recoverAddress(sig, TYPED_DATA);
		expect(recovered).toEqual(EIP712.recoverAddress(sig, TYPED_DATA));
		expect(Eip712Wasm.verifyTypedData(sig, TYPED_DATA, recovered)).toBe(true);
	});

	it("init() initializes both Keccak256Wasm and unified primitives WASM", async () => {
		unloadWasm();
		Keccak256Wasm.reset();
		await Eip712Wasm.init();
		expect(Keccak256Wasm.isReady()).toBe(true);
		expect(isWasmLoaded()).toBe(true);
	});
});
