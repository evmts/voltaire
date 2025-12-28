import { Address, EIP712, Hex, Secp256k1 } from "@tevm/voltaire";
// EIP-712: DAO governance vote signature

// Generate voter keypair
const voterPrivateKey = Secp256k1.PrivateKey.random();
const voterPublicKey = Secp256k1.PrivateKey.toPublicKey(voterPrivateKey);
const voterAddress = Secp256k1.PublicKey.toAddress(voterPublicKey);

const governorAddress = Address(
	"0xc0Da02939E1441F497fd74F78cE7Decb17B66529",
); // Compound Governor

// Governance vote typed data
const vote = {
	domain: {
		name: "Compound Governor Bravo",
		version: "1",
		chainId: 1n,
		verifyingContract: governorAddress,
	},
	types: {
		Ballot: [
			{ name: "proposalId", type: "uint256" },
			{ name: "support", type: "uint8" },
			{ name: "reason", type: "string" },
		],
	},
	primaryType: "Ballot",
	message: {
		proposalId: 42n,
		support: 1, // 0 = against, 1 = for, 2 = abstain
		reason:
			"This proposal aligns with protocol growth objectives and maintains decentralization",
	},
};

// Voter signs ballot off-chain (gasless voting)
const signature = EIP712.signTypedData(vote, voterPrivateKey);

// Verify vote signature
const recovered = EIP712.recoverAddress(signature, vote);
const isValid = EIP712.verifyTypedData(signature, vote, voterAddress);

// Vote hash
const voteHash = EIP712.hashTypedData(vote);
