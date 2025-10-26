import { PrivateKeySignerImpl } from "../../../native/crypto/signers/private-key-signer.js";
import { getAddress } from "../../../native/crypto/signers/utils.js";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const signer = PrivateKeySignerImpl.fromPrivateKey({
	privateKey: testPrivateKey,
});

export function main(): void {
	getAddress(signer);
}
