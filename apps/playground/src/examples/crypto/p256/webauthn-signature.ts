import { Bytes, Hash, P256 } from "@tevm/voltaire";
const authenticatorPrivateKey = Bytes.random(32);
const credentialPublicKey = P256.derivePublicKey(authenticatorPrivateKey);
const challenge = Bytes.random(32);

// 3. Client Data (simulated)
const clientData = {
	type: "webauthn.get",
	challenge: Array.from(challenge)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""),
	origin: "https://example.com",
};

// 4. Authenticator Data (simulated)
const rpIdHash = Hash.keccak256String("example.com");
const flags = Bytes([0x01]); // User present
const signCount = Bytes([0x00, 0x00, 0x00, 0x01]); // Counter = 1

const authenticatorData = Bytes.concat(rpIdHash, flags, signCount);

// 5. Create signature over authenticator data + client data hash
const clientDataJSON = JSON.stringify(clientData);
const clientDataHash = Hash.keccak256String(clientDataJSON);

const signedData = Bytes.concat(authenticatorData, clientDataHash);

const signedDataHash = Hash.keccak256(signedData);
const signature = P256.sign(signedDataHash, authenticatorPrivateKey);

// Reconstruct signed data
const verifyClientDataHash = Hash.keccak256String(clientDataJSON);
const verifySignedData = Bytes.concat(authenticatorData, verifyClientDataHash);

const verifySignedDataHash = Hash.keccak256(verifySignedData);
const isValid = P256.verify(
	signature,
	verifySignedDataHash,
	credentialPublicKey,
);

// Wrong challenge
const wrongChallenge = Bytes.random(32);
const wrongClientData = {
	...clientData,
	challenge: Array.from(wrongChallenge)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""),
};
const wrongClientDataHash = Hash.keccak256String(
	JSON.stringify(wrongClientData),
);
const wrongSignedData = Bytes.concat(authenticatorData, wrongClientDataHash);
const wrongHash = Hash.keccak256(wrongSignedData);

// Wrong origin
const wrongOrigin = { ...clientData, origin: "https://evil.com" };
const wrongOriginHash = Hash.keccak256String(JSON.stringify(wrongOrigin));
const wrongOriginSignedData = Bytes.concat(authenticatorData, wrongOriginHash);
const wrongOriginHashFinal = Hash.keccak256(wrongOriginSignedData);
