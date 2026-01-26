import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/crypto/HDWallet/HDWallet.cleanup.test.ts", "src/crypto/Keystore/Keystore.cleanup.test.ts"],
		environment: "node",
	},
});
