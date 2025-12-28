import { P256 } from "voltaire";
// Alice's keypair
const alicePrivateKey = crypto.getRandomValues(new Uint8Array(32));
const alicePublicKey = P256.derivePublicKey(alicePrivateKey);

// Bob's keypair
const bobPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const bobPublicKey = P256.derivePublicKey(bobPrivateKey);

// ECDH: Alice computes shared secret using her private key + Bob's public key
const aliceSharedSecret = P256.ecdh(alicePrivateKey, bobPublicKey);

// ECDH: Bob computes shared secret using his private key + Alice's public key
const bobSharedSecret = P256.ecdh(bobPrivateKey, alicePublicKey);

// Verify symmetric property
const secretsMatch = aliceSharedSecret.every(
	(v, i) => v === bobSharedSecret[i],
);

// Carol joins
const carolPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const carolPublicKey = P256.derivePublicKey(carolPrivateKey);

const sharedAB = P256.ecdh(alicePrivateKey, bobPublicKey);
const sharedBA = P256.ecdh(bobPrivateKey, alicePublicKey);

const sharedAC = P256.ecdh(alicePrivateKey, carolPublicKey);
const sharedCA = P256.ecdh(carolPrivateKey, alicePublicKey);

const sharedBC = P256.ecdh(bobPrivateKey, carolPublicKey);
const sharedCB = P256.ecdh(carolPrivateKey, bobPublicKey);

// Verify independence
const abVsAc = sharedAB.every((v, i) => v === sharedAC[i]);
const abVsBc = sharedAB.every((v, i) => v === sharedBC[i]);
const acVsBc = sharedAC.every((v, i) => v === sharedBC[i]);

// Client and server establish shared secret
const clientPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const clientPublicKey = P256.derivePublicKey(clientPrivateKey);

const serverPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const serverPublicKey = P256.derivePublicKey(serverPrivateKey);

const clientShared = P256.ecdh(clientPrivateKey, serverPublicKey);
const serverShared = P256.ecdh(serverPrivateKey, clientPublicKey);
