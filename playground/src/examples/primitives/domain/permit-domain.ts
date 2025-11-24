import * as Domain from "../../../../../src/primitives/Domain/index.js";
import { hash as keccak256 } from "../../../../../src/crypto/Keccak256/index.js";
import * as Hex from "../../../../../src/primitives/Hex/index.js";

// Example: ERC-2612 Permit domain for gasless token approvals

// USDC on Ethereum mainnet
const usdc = Domain.from({
	name: "USD Coin",
	version: "2",
	chainId: 1,
	verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
});

console.log("USDC Permit domain:", usdc);
console.log("Separator:", Hex.fromBytes(Domain.toHash(usdc, { keccak256 })));

// ERC-2612 Permit type
const permitTypes = {
	Permit: [
		{ name: "owner", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "value", type: "uint256" },
		{ name: "nonce", type: "uint256" },
		{ name: "deadline", type: "uint256" },
	],
};

const permitTypeString = Domain.encodeType("Permit", permitTypes);
console.log("\nPermit type:", permitTypeString);

// Example permit message
const permit = {
	owner: "0x1234567890123456789012345678901234567890",
	spender: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap Router
	value: "1000000000", // 1000 USDC (6 decimals)
	nonce: "0",
	deadline: "1735689600",
};

const encodedPermit = Domain.encodeData("Permit", permit, permitTypes, {
	keccak256,
});
console.log(
	"\nEncoded permit hash:",
	Hex.fromBytes(encodedPermit).slice(0, 20),
);

// USDT (older version, no version field)
const usdt = Domain.from({
	name: "Tether USD",
	chainId: 1,
	verifyingContract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
});

console.log("\nUSDT Permit domain:", usdt);
console.log("Note: No version field");

// DAI uses Dai Permit (different from ERC-2612)
const dai = Domain.from({
	name: "Dai Stablecoin",
	version: "1",
	chainId: 1,
	verifyingContract: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
});

console.log("\nDAI domain:", dai);
console.log("Note: DAI has its own permit system");

// WETH (no permit)
const weth = Domain.from({
	name: "Wrapped Ether",
	version: "1",
	chainId: 1,
	verifyingContract: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
});

console.log("\nWETH domain:", weth);
console.log("Note: WETH has no permit function");

// Compare separators
const usdcSep = Domain.toHash(usdc, { keccak256 });
const usdtSep = Domain.toHash(usdt, { keccak256 });
const daiSep = Domain.toHash(dai, { keccak256 });
const wethSep = Domain.toHash(weth, { keccak256 });

console.log("\nSeparators comparison:");
console.log("USDC:", Hex.fromBytes(usdcSep).slice(0, 20));
console.log("USDT:", Hex.fromBytes(usdtSep).slice(0, 20));
console.log("DAI: ", Hex.fromBytes(daiSep).slice(0, 20));
console.log("WETH:", Hex.fromBytes(wethSep).slice(0, 20));
console.log("\nEach token has unique permit domain");
