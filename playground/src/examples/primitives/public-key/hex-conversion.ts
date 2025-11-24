import * as PrivateKey from "../../../primitives/PrivateKey/index.js";
import * as PublicKey from "../../../primitives/PublicKey/index.js";

// Create public key from private key
const privateKey = PrivateKey.from(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const publicKey = PublicKey.fromPrivateKey(privateKey);
const hexWithPrefix = PublicKey._toHex.call(publicKey);
const pkFromHexPrefix = PublicKey.from(
	"0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
);
const pkFromHexNoPrefix = PublicKey.from(
	"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
);

// Verify equivalence
const match1 =
	PublicKey._toHex.call(pkFromHexPrefix) ===
	PublicKey._toHex.call(pkFromHexNoPrefix);
const original = PublicKey.fromPrivateKey(privateKey);
const hex = PublicKey._toHex.call(original);
const restored = PublicKey.from(hex);
const match2 =
	PublicKey._toHex.call(original) === PublicKey._toHex.call(restored);
const hexString =
	"0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5";
const convertedHex = PublicKey.toHex(hexString);
try {
	// Too short
	PublicKey.from("0x1234");
} catch (e) {}

try {
	// Invalid hex characters
	PublicKey.from(`0xGGGGGGGGGGGG${"0".repeat(116)}`);
} catch (e) {}

try {
	// Too long
	PublicKey.from(`0x${"00".repeat(65)}`);
} catch (e) {}
