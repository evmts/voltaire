import { hash as keccak256 } from "../../../../../src/crypto/Keccak256/index.js";
import * as Domain from "../../../../../src/primitives/Domain/index.js";
import * as Hex from "../../../../../src/primitives/Hex/index.js";

// Example: Real-world contract domains from major protocols

// Uniswap V2 Pair
const uniswapV2 = Domain.from({
	name: "Uniswap V2",
	version: "1",
	chainId: 1,
	verifyingContract: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
});

// Uniswap V3
const uniswapV3 = Domain.from({
	name: "Uniswap V3",
	version: "1",
	chainId: 1,
	verifyingContract: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
});

// Aave V2
const aaveV2 = Domain.from({
	name: "Aave interest bearing USDC",
	version: "1",
	chainId: 1,
	verifyingContract: "0xBcca60bB61934080951369a648Fb03DF4F96263C",
});

// Compound cDAI
const compound = Domain.from({
	name: "Compound Dai",
	version: "1",
	chainId: 1,
	verifyingContract: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
});

// OpenSea Wyvern Exchange
const openSea = Domain.from({
	name: "Wyvern Exchange Contract",
	version: "2.3",
	chainId: 1,
	verifyingContract: "0x7f268357A8c2552623316e2562D90e642bB538E5",
});

// 1inch Exchange
const oneInch = Domain.from({
	name: "1inch Aggregation Router",
	version: "5",
	chainId: 1,
	verifyingContract: "0x1111111254EEB25477B68fb85Ed929f73A960582",
});

// Gnosis Safe
const safe = Domain.from({
	name: "Gnosis Safe",
	version: "1.3.0",
	chainId: 1,
	verifyingContract: "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552",
});
