import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
		exclude: [
			"**/node_modules/**",
			"src/crypto/Signers/Signers.test.ts",
			// Exclude tests that require native FFI bindings (ref-napi)
			"src/crypto/HDWallet/HDWallet.test.ts",
			"src/crypto/EIP712/EIP712.test.ts",
			"src/primitives/PrivateKey/PrivateKey.test.ts",
			"src/primitives/PublicKey/PublicKey.test.ts",
			"src/primitives/ContractCode/ContractCode.test.ts",
			"src/primitives/InitCode/InitCode.test.ts",
			"src/services/Account/Account.test.ts",
			"src/services/Account/fromMnemonic.test.ts",
			"src/services/Contract/Contract.test.ts",
			"src/services/Signer/Signer.test.ts",
			"src/services/Signer/actions/deployContract.test.ts",
			"src/services/Signer/actions/writeContract.test.ts",
			// Exclude tests with BrandedAbi/voltaire vitest SSR issues
			"src/services/Provider/actions/simulateContract.test.ts",
			"src/services/Provider/actions/readContract.test.ts",
			"src/services/Provider/actions/multicall.test.ts",
			"src/services/Multicall/Multicall.test.ts",
			"src/services/AbiEncoder/AbiEncoder.test.ts",
			"src/primitives/Abi/Abi.test.ts",
			"src/services/Provider/Provider.test.ts",
			"src/services/RawProvider/RawProvider.test.ts",
			"src/services/RpcBatch/RpcBatch.test.ts",
			"src/services/Transport/Transport.test.ts",
			"src/crypto/Secp256k1/Secp256k1.test.ts",
			"src/crypto/Bls12381/Bls12381.test.ts",
			"src/crypto/HMAC/HMAC.test.ts",
			"src/contract/EventStream.test.ts",
			"src/transaction/TransactionStream.test.ts",
		],
		environment: "node",
		setupFiles: ["./vitest.setup.ts"],
	},
});
