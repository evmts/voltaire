import * as Domain from "../../../../../src/primitives/Domain/index.js";
import { hash as keccak256 } from "../../../../../src/crypto/Keccak256/index.js";
import * as Hex from "../../../../../src/primitives/Hex/index.js";

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
console.log("Simple separator:", Hex.fromBytes(simpleSeparator));

// Domain with chainId
const withChain = Domain.from({
	name: "SimpleApp",
	version: "1",
	chainId: 1,
});

const chainSeparator = Domain.toHash(withChain, { keccak256 });
console.log("With chain separator:", Hex.fromBytes(chainSeparator));

// Domain with contract
const withContract = Domain.from({
	name: "SimpleApp",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
});

const contractSeparator = Domain.toHash(withContract, { keccak256 });
console.log("With contract separator:", Hex.fromBytes(contractSeparator));

// Domain with salt
const withSalt = Domain.from({
	name: "SimpleApp",
	version: "1",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
});

const saltSeparator = Domain.toHash(withSalt, { keccak256 });
console.log("With salt separator:", Hex.fromBytes(saltSeparator));

// Different separators prevent replay attacks
console.log("\nSeparators are unique:");
console.log(
	"Simple != Chain:",
	!Hex.equals(Hex.fromBytes(simpleSeparator), Hex.fromBytes(chainSeparator)),
);
console.log(
	"Chain != Contract:",
	!Hex.equals(Hex.fromBytes(chainSeparator), Hex.fromBytes(contractSeparator)),
);
console.log(
	"Contract != Salt:",
	!Hex.equals(Hex.fromBytes(contractSeparator), Hex.fromBytes(saltSeparator)),
);

// Get type definitions for each
console.log("\nType definitions:");
console.log("Simple:", Domain.getEIP712DomainType(simple));
console.log("With chain:", Domain.getEIP712DomainType(withChain));
console.log("With contract:", Domain.getEIP712DomainType(withContract));
console.log("With salt:", Domain.getEIP712DomainType(withSalt));
