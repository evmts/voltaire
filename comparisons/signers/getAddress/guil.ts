import { PrivateKeySignerImpl } from "../../../src/crypto/signers/private-key-signer.ts";
import { getAddress } from "../../../src/crypto/signers/utils.ts";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const signer = PrivateKeySignerImpl.fromPrivateKey({
	privateKey: testPrivateKey,
});

export function main(): void {
	getAddress(signer);
}
