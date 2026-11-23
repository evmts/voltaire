import { runBenchSuite } from "../../bench-harness.js";
import { Secp256k1 } from "../Secp256k1/index.js";
import { getAddress } from "./utils.js";

const privKey = new Uint8Array(32).fill(7);
const pubKey = Secp256k1.derivePublicKey(privKey);
const mockSigner = {
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
	publicKey: pubKey,
	signMessage: async () => "0x",
	signTransaction: async () => ({}),
	signTypedData: async () => "0x",
};

await runBenchSuite("voltaire-ts:crypto-signers", [
	{ name: "signers.getAddress", fn: () => getAddress(mockSigner) },
	{
		name: "Secp256k1.derivePublicKey",
		fn: () => Secp256k1.derivePublicKey(privKey),
	},
]);
