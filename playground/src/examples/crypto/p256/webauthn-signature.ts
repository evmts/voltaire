import { Hash, P256 } from "voltaire";
const authenticatorPrivateKey = crypto.getRandomValues(new Uint8Array(32));
const credentialPublicKey = P256.derivePublicKey(authenticatorPrivateKey);
const challenge = crypto.getRandomValues(new Uint8Array(32));

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
const flags = new Uint8Array([0x01]); // User present
const signCount = new Uint8Array([0x00, 0x00, 0x00, 0x01]); // Counter = 1

const authenticatorData = new Uint8Array([...rpIdHash, ...flags, ...signCount]);

// 5. Create signature over authenticator data + client data hash
const clientDataJSON = JSON.stringify(clientData);
const clientDataHash = Hash.keccak256String(clientDataJSON);

const signedData = new Uint8Array([...authenticatorData, ...clientDataHash]);

const signedDataHash = Hash.keccak256(signedData);
const signature = P256.sign(signedDataHash, authenticatorPrivateKey);

// Reconstruct signed data
const verifyClientDataHash = Hash.keccak256String(clientDataJSON);
const verifySignedData = new Uint8Array([
	...authenticatorData,
	...verifyClientDataHash,
]);

const verifySignedDataHash = Hash.keccak256(verifySignedData);
const isValid = P256.verify(
	signature,
	verifySignedDataHash,
	credentialPublicKey,
);

// Wrong challenge
const wrongChallenge = crypto.getRandomValues(new Uint8Array(32));
const wrongClientData = {
	...clientData,
	challenge: Array.from(wrongChallenge)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""),
};
const wrongClientDataHash = Hash.keccak256String(
	JSON.stringify(wrongClientData),
);
const wrongSignedData = new Uint8Array([
	...authenticatorData,
	...wrongClientDataHash,
]);
const wrongHash = Hash.keccak256(wrongSignedData);

// Wrong origin
const wrongOrigin = { ...clientData, origin: "https://evil.com" };
const wrongOriginHash = Hash.keccak256String(JSON.stringify(wrongOrigin));
const wrongOriginSignedData = new Uint8Array([
	...authenticatorData,
	...wrongOriginHash,
]);
const wrongOriginHashFinal = Hash.keccak256(wrongOriginSignedData);
