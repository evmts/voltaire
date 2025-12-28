import { hash as keccak256 } from "voltaire";
import { Domain, Hex } from "voltaire";

// Example: DAI permit (different from ERC-2612)

// DAI uses a different permit implementation than ERC-2612
// It predates EIP-2612 and has slightly different semantics

const dai = Domain.from({
	name: "Dai Stablecoin",
	version: "1",
	chainId: 1,
	verifyingContract: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
});

const separator = Domain.toHash(dai, { keccak256 });

// DAI Permit type (different from ERC-2612)
const daiPermitTypes = {
	Permit: [
		{ name: "holder", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "nonce", type: "uint256" },
		{ name: "expiry", type: "uint256" },
		{ name: "allowed", type: "bool" },
	],
};

const permitTypeString = Domain.encodeType("Permit", daiPermitTypes);

// Key differences from ERC-2612:
// 1. "holder" instead of "owner"
// 2. "expiry" instead of "deadline"
// 3. "allowed" boolean instead of "value" uint256
// 4. No value field - it's either allowed (max) or not allowed (0)

// Example DAI permit
const daiPermit = {
	holder: "0x1234567890123456789012345678901234567890",
	spender: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap Router
	nonce: "0",
	expiry: "1735689600",
	allowed: true, // true = infinite approval, false = revoke
};

const encodedPermit = Domain.encodeData("Permit", daiPermit, daiPermitTypes, {
	keccak256,
});

// Compare with MakerDAO MCD contracts
const mcdJug = Domain.from({
	name: "Maker Jug",
	version: "1",
	chainId: 1,
	verifyingContract: "0x19c0976f590D67707E62397C87829d896Dc0f1F1",
});

const mcdVat = Domain.from({
	name: "Maker Vat",
	version: "1",
	chainId: 1,
	verifyingContract: "0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B",
});

// DAI on other chains
const daiPolygon = Domain.from({
	name: "Dai Stablecoin",
	version: "1",
	chainId: 137, // Polygon
	verifyingContract: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
});

const daiOptimism = Domain.from({
	name: "Dai Stablecoin",
	version: "1",
	chainId: 10, // Optimism
	verifyingContract: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
});
