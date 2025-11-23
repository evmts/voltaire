// ECDH key exchange
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Alice generates keypair
const alicePrivateKey = Secp256k1.PrivateKey.random();
const alicePublicKey = Secp256k1.derivePublicKey(alicePrivateKey);
console.log(
	"Alice public key:",
	Hex.from(alicePublicKey).toString().slice(0, 40) + "...",
);

// Bob generates keypair
const bobPrivateKey = Secp256k1.PrivateKey.random();
const bobPublicKey = Secp256k1.derivePublicKey(bobPrivateKey);
console.log(
	"Bob public key:",
	Hex.from(bobPublicKey).toString().slice(0, 40) + "...",
);

// Alice computes shared secret: alicePrivate * bobPublic
const aliceShared = Secp256k1.ecdh(alicePrivateKey, bobPublicKey);
console.log("\nAlice shared secret:", Hex.from(aliceShared).toString());

// Bob computes shared secret: bobPrivate * alicePublic
const bobShared = Secp256k1.ecdh(bobPrivateKey, alicePublicKey);
console.log("Bob shared secret:", Hex.from(bobShared).toString());

// Verify they match
const match =
	aliceShared.length === bobShared.length &&
	aliceShared.every((byte, i) => byte === bobShared[i]);
console.log("\nShared secrets match:", match);
console.log("Shared secret length:", aliceShared.length, "bytes");
