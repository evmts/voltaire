import * as P256 from "../../../crypto/P256/index.js";
import { Hash } from "../../../primitives/Hash/index.js";

const iosPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const iosPublicKey = P256.derivePublicKey(iosPrivateKey);

const androidPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const androidPublicKey = P256.derivePublicKey(androidPrivateKey);

const webauthnPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const webauthnPublicKey = P256.derivePublicKey(webauthnPrivateKey);

const yubikeyPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const yubikeyPublicKey = P256.derivePublicKey(yubikeyPrivateKey);

// Sign message on iOS
const message = "Transfer 1.5 ETH to 0x742d35Cc...";
const messageHash = Hash.keccak256String(message);
const iosSignature = P256.sign(messageHash, iosPrivateKey);

// Verify signature on any platform (just needs public key)
const verifiedOnAndroid = P256.verify(iosSignature, messageHash, iosPublicKey);
const verifiedOnWebAuthn = P256.verify(iosSignature, messageHash, iosPublicKey);
const verifiedOnYubiKey = P256.verify(iosSignature, messageHash, iosPublicKey);

// Register new device
const newDevicePrivateKey = crypto.getRandomValues(new Uint8Array(32));
const newDevicePublicKey = P256.derivePublicKey(newDevicePrivateKey);

// Sign migration authorization on old device
const migrationData = {
	oldPublicKey: Array.from(iosPublicKey),
	newPublicKey: Array.from(newDevicePublicKey),
	timestamp: Date.now(),
};

const migrationHash = Hash.keccak256String(JSON.stringify(migrationData));
const migrationSignature = P256.sign(migrationHash, iosPrivateKey);
