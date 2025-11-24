import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	test: {
		environment: "jsdom",
	},
	resolve: {
		alias: {
			"voltaire/primitives/Address": resolve(
				__dirname,
				"../src/primitives/Address",
			),
			"voltaire/primitives/Hex": resolve(__dirname, "../src/primitives/Hex"),
			"voltaire/primitives/Hash": resolve(__dirname, "../src/primitives/Hash"),
			"voltaire/primitives/RLP": resolve(__dirname, "../src/primitives/RLP"),
			"voltaire/primitives/ABI": resolve(__dirname, "../src/primitives/ABI"),
			"voltaire/crypto/Keccak256": resolve(
				__dirname,
				"../src/crypto/Keccak256",
			),
			"voltaire/crypto/Secp256k1": resolve(
				__dirname,
				"../src/crypto/Secp256k1",
			),
			"voltaire/crypto/SHA256": resolve(__dirname, "../src/crypto/SHA256"),
			"voltaire/crypto/Blake2": resolve(__dirname, "../src/crypto/Blake2"),
			"voltaire/crypto/Ripemd160": resolve(
				__dirname,
				"../src/crypto/Ripemd160",
			),
			"voltaire/crypto/HDWallet": resolve(__dirname, "../src/crypto/HDWallet"),
		},
	},
	server: {
		fs: {
			allow: [".."],
		},
	},
});
