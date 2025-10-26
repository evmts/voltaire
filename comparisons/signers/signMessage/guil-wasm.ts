import { PrivateKeySignerImpl } from "../../../wasm/crypto/signers/private-key-signer.js";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const signer = PrivateKeySignerImpl.fromPrivateKey({
	privateKey: testPrivateKey,
});

const testMessage = "Hello, Ethereum!";

export async function main(): Promise<void> {
	await signer.signMessage(testMessage);
}
