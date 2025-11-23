// EIP-712: DAO governance vote signature
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate voter keypair
const voterPrivateKey = Secp256k1.PrivateKey.random();
const voterPublicKey = Secp256k1.PrivateKey.toPublicKey(voterPrivateKey);
const voterAddress = Secp256k1.PublicKey.toAddress(voterPublicKey);

const governorAddress = Address.from(
	"0xc0Da02939E1441F497fd74F78cE7Decb17B66529",
); // Compound Governor

console.log("Voter address:", voterAddress.toHex());
console.log("Governor contract:", governorAddress.toHex());

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
console.log(
	"Vote signature r:",
	Hex.fromBytes(signature.r).toString().slice(0, 20) + "...",
);
console.log(
	"Vote signature s:",
	Hex.fromBytes(signature.s).toString().slice(0, 20) + "...",
);
console.log("Vote signature v:", signature.v);

// Verify vote signature
const recovered = EIP712.recoverAddress(signature, vote);
const isValid = EIP712.verifyTypedData(signature, vote, voterAddress);
console.log("Vote signature valid:", isValid);
console.log(
	"Recovered voter matches:",
	recovered.equals(voterAddress),
);

// Vote hash
const voteHash = EIP712.hashTypedData(vote);
console.log("Vote hash:", Hex.fromBytes(voteHash).toString());

console.log("\nVote details:");
console.log("- Proposal #42");
console.log("- Position: FOR");
console.log("- Reason provided");
console.log("\nBenefits:");
console.log("- Voter signs off-chain (no gas)");
console.log("- Aggregator batches votes");
console.log("- Single tx to submit all votes");
console.log("- Snapshot-style governance");
