// Complete key exchange protocol
import * as X25519 from "../../../crypto/X25519/index.js";
import * as Hex from "../../../primitives/Hex/index.js";
const aliceKeypair = X25519.generateKeypair();
const bobKeypair = X25519.generateKeypair();
const aliceShared = X25519.scalarmult(
	aliceKeypair.secretKey,
	bobKeypair.publicKey,
);
const bobShared = X25519.scalarmult(
	bobKeypair.secretKey,
	aliceKeypair.publicKey,
);
const match =
	aliceShared.length === bobShared.length &&
	aliceShared.every((byte, i) => byte === bobShared[i]);
