import * as Domain from "../../../../../src/primitives/Domain/index.js";
import { hash as keccak256 } from "../../../../../src/crypto/Keccak256/index.js";
import * as Hex from "../../../../../src/primitives/Hex/index.js";

// Example: Comparing domains and separators

// Protocol upgrades - same name, different versions
const protocolV1 = Domain.from({
	name: "MyProtocol",
	version: "1",
	chainId: 1,
	verifyingContract: "0x1111111111111111111111111111111111111111",
});

const protocolV2 = Domain.from({
	name: "MyProtocol",
	version: "2",
	chainId: 1,
	verifyingContract: "0x2222222222222222222222222222222222222222",
});

const protocolV3 = Domain.from({
	name: "MyProtocol",
	version: "3",
	chainId: 1,
	verifyingContract: "0x3333333333333333333333333333333333333333",
});

console.log("Protocol version upgrades:\n");
const v1Sep = Domain.toHash(protocolV1, { keccak256 });
const v2Sep = Domain.toHash(protocolV2, { keccak256 });
const v3Sep = Domain.toHash(protocolV3, { keccak256 });

console.log("V1:", Hex.fromBytes(v1Sep).slice(0, 20));
console.log("V2:", Hex.fromBytes(v2Sep).slice(0, 20));
console.log("V3:", Hex.fromBytes(v3Sep).slice(0, 20));
console.log(
	"All different:",
	!Hex.equals(Hex.fromBytes(v1Sep), Hex.fromBytes(v2Sep)) &&
		!Hex.equals(Hex.fromBytes(v2Sep), Hex.fromBytes(v3Sep)),
);

// Cross-chain deployments
const mainnetDeploy = Domain.from({
	name: "Protocol",
	version: "1",
	chainId: 1,
	verifyingContract: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
});

const l2Deploy = Domain.from({
	name: "Protocol",
	version: "1",
	chainId: 10, // Optimism
	verifyingContract: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
});

console.log("\nCross-chain deployment (same contract address):\n");
const mainnetSep = Domain.toHash(mainnetDeploy, { keccak256 });
const l2Sep = Domain.toHash(l2Deploy, { keccak256 });

console.log("Mainnet:", Hex.fromBytes(mainnetSep).slice(0, 20));
console.log("L2:     ", Hex.fromBytes(l2Sep).slice(0, 20));
console.log(
	"Different due to chainId:",
	!Hex.equals(Hex.fromBytes(mainnetSep), Hex.fromBytes(l2Sep)),
);

// Fork detection
const preMerge = Domain.from({
	name: "Token",
	version: "1",
	chainId: 1, // Pre-merge ETH
	verifyingContract: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
});

const postMergePow = Domain.from({
	name: "Token",
	version: "1",
	chainId: 10001, // ETHPOW fork
	verifyingContract: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
});

console.log("\nFork protection:\n");
const preSep = Domain.toHash(preMerge, { keccak256 });
const postSep = Domain.toHash(postMergePow, { keccak256 });

console.log("Pre-merge: ", Hex.fromBytes(preSep).slice(0, 20));
console.log("Fork:      ", Hex.fromBytes(postSep).slice(0, 20));
console.log(
	"Fork has different separator:",
	!Hex.equals(Hex.fromBytes(preSep), Hex.fromBytes(postSep)),
);

// Testing vs production
const testDomain = Domain.from({
	name: "App",
	version: "1-test",
	chainId: 11155111, // Sepolia
	verifyingContract: "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
});

const prodDomain = Domain.from({
	name: "App",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
});

console.log("\nTest vs production:\n");
const testSep = Domain.toHash(testDomain, { keccak256 });
const prodSep = Domain.toHash(prodDomain, { keccak256 });

console.log("Test:", Hex.fromBytes(testSep).slice(0, 20));
console.log("Prod:", Hex.fromBytes(prodSep).slice(0, 20));
console.log(
	"Separated by chain and version:",
	!Hex.equals(Hex.fromBytes(testSep), Hex.fromBytes(prodSep)),
);

// Type definitions
console.log("\nType definitions:\n");

const minimal = Domain.from({ name: "Min" });
const complete = Domain.from({
	name: "Max",
	version: "1",
	chainId: 1,
	verifyingContract: "0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
});

console.log("Minimal:", Domain.getEIP712DomainType(minimal).length, "fields");
console.log("Complete:", Domain.getEIP712DomainType(complete).length, "fields");
console.log("\nMinimal fields:", Domain.getEIP712DomainType(minimal));
console.log("Complete fields:", Domain.getEIP712DomainType(complete));
