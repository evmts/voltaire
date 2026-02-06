import { Address, PrivateKey, PublicKey } from "@tevm/voltaire";
// Create a public key
const privateKey = PrivateKey(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const publicKey = PublicKey.fromPrivateKey(privateKey);

// Internal API examples
const hexInternal = PublicKey._toHex.call(publicKey);

const addressInternal = Address(PublicKey._toAddress.call(publicKey));

// Verify signature (internal)
const message = "Test message";
const hash = Hash.keccak256String(message);
const signature = PrivateKey._sign(privateKey, hash);
const validInternal = PublicKey._verify(publicKey, hash, signature);

// Wrapper API examples (takes string)
const pkHex =
	"0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5";

const hexWrapper = PublicKey.toHex(pkHex);

const addressWrapper = Address(PublicKey.toAddress(pkHex));

// Note: verify wrapper takes string, converts internally
const pkHexForVerify = PublicKey._toHex.call(publicKey);
const validWrapper = PublicKey.verify(pkHexForVerify, hash, signature);

// Internal API: no conversion
console.time("Internal API (100 iterations)");
for (let i = 0; i < 100; i++) {
	PublicKey._toHex.call(publicKey);
}
console.timeEnd("Internal API (100 iterations)");

// Wrapper API: includes conversion
console.time("Wrapper API (100 iterations)");
for (let i = 0; i < 100; i++) {
	PublicKey.toHex(pkHex);
}
console.timeEnd("Wrapper API (100 iterations)");
