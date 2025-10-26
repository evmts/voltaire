import { PrivateKeySignerImpl } from "../../../wasm/crypto/signers/private-key-signer.js";
import { getAddress } from "../../../wasm/crypto/signers/utils.js";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const signer = PrivateKeySignerImpl.fromPrivateKey({
	privateKey: testPrivateKey,
});

export function main(): void {
	getAddress(signer);
}
