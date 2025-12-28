
import { Address, PrivateKey, PublicKey } from "voltaire";
// Example: PublicKey basics

// Create a private key for testing
const privateKey = PrivateKey.from(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const publicKey = PublicKey.fromPrivateKey(privateKey);

// Create from hex string (64 bytes uncompressed)
const pkFromHex = PublicKey.from(
	"0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
);
const address = Address(PublicKey._toAddress.call(publicKey));
const message = "Hello, Voltaire!";
const messageHash = Hash.keccak256String(message);

const signature = PrivateKey._sign(privateKey, messageHash);

const isValid = PublicKey._verify(publicKey, messageHash, signature);
const pkHex =
	"0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5";
const addressWrapper = Address(PublicKey.toAddress(pkHex));
