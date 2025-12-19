import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Delegate contract address
const delegate = Address.from("0x5aAeD5932B9EB3Cd462dDBAeFA21Da757F30FBD");

// Private key for signing
const privateKey = new Uint8Array(32);
privateKey.fill(3);

// Create unsigned authorization
const unsigned = {
	chainId: 1n,
	address: delegate,
	nonce: 10n,
};

// Hash the unsigned authorization
const authHash = Authorization.hash(unsigned);

// Sign the authorization
const signed = Authorization.sign(unsigned, privateKey);

// Validate signature format
try {
	Authorization.validate(signed);
} catch (error) {}

// Recover signer from signature
const recoveredAddress = Authorization.verify(signed);
