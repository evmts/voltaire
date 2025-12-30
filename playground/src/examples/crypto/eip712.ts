import { Address, EIP712, Hex, Secp256k1 } from "@tevm/voltaire";

// EIP-712 - Typed structured data signing

// Define domain separator (binds signature to specific app + chain)
const domain = {
	name: "MyDApp",
	version: "1",
	chainId: 1n,
	verifyingContract: "0x1234567890123456789012345678901234567890" as const,
};

// Define message types
const types = {
	Person: [
		{ name: "name", type: "string" },
		{ name: "wallet", type: "address" },
	],
	Mail: [
		{ name: "from", type: "Person" },
		{ name: "to", type: "Person" },
		{ name: "contents", type: "string" },
	],
};

// Create typed data object
const typedData = {
	domain,
	types,
	primaryType: "Mail",
	message: {
		from: {
			name: "Alice",
			wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
		},
		to: {
			name: "Bob",
			wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
		},
		contents: "Hello, Bob!",
	},
};

// Hash typed data (produces 32-byte digest)
const hash = EIP712.hashTypedData(typedData);
console.log("Typed data hash:", Hex.fromBytes(hash));

// Domain separator hash
const domainHash = EIP712.Domain.hash(domain);
console.log("Domain hash:", Hex.fromBytes(domainHash));

// Type hash
const typeHash = EIP712.hashType("Mail", types);
console.log("Type hash:", Hex.fromBytes(typeHash));

// Sign with private key
const privateKey = Secp256k1.randomPrivateKey();
const signature = Secp256k1.sign(hash, privateKey);
console.log("Signature r:", Hex.fromBytes(signature.r));
console.log("Signature s:", Hex.fromBytes(signature.s));
console.log("Signature v:", signature.v);

// Recover signer address
const publicKey = Secp256k1.recoverPublicKey(signature, hash);
const signerAddress = Address.fromPublicKey(publicKey);
const signerChecksummed = Address.toChecksummed(signerAddress);
console.log("Signer address:", signerChecksummed);

// ERC-2612 Permit example
const permitTypes = {
	Permit: [
		{ name: "owner", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "value", type: "uint256" },
		{ name: "nonce", type: "uint256" },
		{ name: "deadline", type: "uint256" },
	],
};

const permit = {
	domain: { name: "USDC", version: "2", chainId: 1n },
	types: permitTypes,
	primaryType: "Permit",
	message: {
		owner: "0x1234567890123456789012345678901234567890",
		spender: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		value: 1000000n, // 1 USDC
		nonce: 0n,
		deadline: 1700000000n,
	},
};

const permitHash = EIP712.hashTypedData(permit);
console.log("Permit hash:", Hex.fromBytes(permitHash));
