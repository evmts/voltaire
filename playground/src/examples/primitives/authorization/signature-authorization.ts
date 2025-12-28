import { Address, Authorization, Bytes, Bytes32 } from "@tevm/voltaire";

// Delegate contract address
const delegate = Address("0x5aAeD5932B9EB3Cd462dDBAeFA21Da757F30FBD");

// Private key for signing
const privateKey = Bytes32.zero();
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
