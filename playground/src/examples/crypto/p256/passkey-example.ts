import { Bytes, Hash, P256 } from "@tevm/voltaire";
// Simulated user and device info
const userId = "user@example.com";
const deviceName = "iPhone 15 Pro";

// 1. Server sends registration challenge
const registrationChallenge = Bytes.random(32);

// 2. Authenticator creates new credential
const credentialId = Bytes.random(16);
const privateKey = Bytes.random(32);
const publicKey = P256.derivePublicKey(privateKey);

// 3. Create attestation signature
const rpId = "example.com";
const rpIdHash = Hash.keccak256String(rpId);
const attestationClientData = {
	type: "webauthn.create",
	challenge: Array.from(registrationChallenge)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""),
	origin: `https://${rpId}`,
};

const clientDataHash = Hash.keccak256String(
	JSON.stringify(attestationClientData),
);

// Attestation statement
const attestationData = Bytes.concat(
	rpIdHash,
	Bytes([0x41, 0x00, 0x00, 0x00, 0x00]), // flags + sign count
	credentialId,
	publicKey,
);

const attestationHash = Hash.keccak256(
	Bytes.concat(attestationData, clientDataHash),
);
const attestationSignature = P256.sign(attestationHash, privateKey);

// 4. Server verifies and stores credential
const verifyAttestationHash = Hash.keccak256(
	Bytes.concat(attestationData, clientDataHash),
);
const attestationValid = P256.verify(
	attestationSignature,
	verifyAttestationHash,
	publicKey,
);

// 1. Server sends authentication challenge
const authChallenge = Bytes.random(32);

// 2. Authenticator creates assertion
const signCount = 1;
const authClientData = {
	type: "webauthn.get",
	challenge: Array.from(authChallenge)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""),
	origin: `https://${rpId}`,
};

const authClientDataHash = Hash.keccak256String(JSON.stringify(authClientData));

// Authenticator data
const authData = Bytes.concat(
	rpIdHash,
	Bytes([0x05]), // flags: user present + user verified
	Bytes([0x00, 0x00, 0x00, signCount]), // counter
);

const assertionSignedData = Bytes.concat(authData, authClientDataHash);

const assertionHash = Hash.keccak256(assertionSignedData);
const assertionSignature = P256.sign(assertionHash, privateKey);

// 3. Server verifies assertion
const verifyAssertionSignedData = Bytes.concat(authData, authClientDataHash);

const verifyAssertionHash = Hash.keccak256(verifyAssertionSignedData);
const assertionValid = P256.verify(
	assertionSignature,
	verifyAssertionHash,
	publicKey,
);

// Check 1: Replay attack prevention (wrong challenge)
const replayChallenge = Bytes.random(32);
const replayClientData = {
	...authClientData,
	challenge: Array.from(replayChallenge)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""),
};
const replayHash = Hash.keccak256(
	Bytes.concat(
		authData,
		Hash.keccak256String(JSON.stringify(replayClientData)),
	),
);

// Check 2: Phishing prevention (wrong origin)
const phishingClientData = {
	...authClientData,
	origin: "https://evil-example.com",
};
const phishingHash = Hash.keccak256(
	Bytes.concat(
		authData,
		Hash.keccak256String(JSON.stringify(phishingClientData)),
	),
);

// Check 3: Wrong credential
const wrongPrivateKey = Bytes.random(32);
const wrongPublicKey = P256.derivePublicKey(wrongPrivateKey);
