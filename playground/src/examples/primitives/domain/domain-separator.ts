import { hash as keccak256 } from "voltaire";
import { Domain, Hex } from "voltaire";

// Example: Computing and using EIP-712 domain separators

// Domain separator is computed as:
// keccak256(
//   keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
//   + keccak256(name)
//   + keccak256(version)
//   + chainId
//   + verifyingContract
// )

// Simple domain
const simple = Domain.from({
	name: "SimpleApp",
	version: "1",
});

const simpleSeparator = Domain.toHash(simple, { keccak256 });

// Domain with chainId
const withChain = Domain.from({
	name: "SimpleApp",
	version: "1",
	chainId: 1,
});

const chainSeparator = Domain.toHash(withChain, { keccak256 });

// Domain with contract
const withContract = Domain.from({
	name: "SimpleApp",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
});

const contractSeparator = Domain.toHash(withContract, { keccak256 });

// Domain with salt
const withSalt = Domain.from({
	name: "SimpleApp",
	version: "1",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
});

const saltSeparator = Domain.toHash(withSalt, { keccak256 });
