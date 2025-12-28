import { hash as keccak256 } from "voltaire";
import { Domain, Hex } from "voltaire";

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
const v1Sep = Domain.toHash(protocolV1, { keccak256 });
const v2Sep = Domain.toHash(protocolV2, { keccak256 });
const v3Sep = Domain.toHash(protocolV3, { keccak256 });

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
const mainnetSep = Domain.toHash(mainnetDeploy, { keccak256 });
const l2Sep = Domain.toHash(l2Deploy, { keccak256 });

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
const preSep = Domain.toHash(preMerge, { keccak256 });
const postSep = Domain.toHash(postMergePow, { keccak256 });

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
const testSep = Domain.toHash(testDomain, { keccak256 });
const prodSep = Domain.toHash(prodDomain, { keccak256 });

const minimal = Domain.from({ name: "Min" });
const complete = Domain.from({
	name: "Max",
	version: "1",
	chainId: 1,
	verifyingContract: "0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
});
