// @ts-nocheck
import { Address } from "../Address/index.js";
/**
 * Known ERC-2612 token permit domains
 */
/**
 * USDC Mainnet (Ethereum)
 */
export const USDC_MAINNET = {
    name: "USD Coin",
    version: "2",
    chainId: 1,
    verifyingContract: Address.fromHex("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
};
/**
 * USDC Polygon
 */
export const USDC_POLYGON = {
    name: "USD Coin",
    version: "2",
    chainId: 137,
    verifyingContract: Address.fromHex("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"),
};
/**
 * USDC Arbitrum
 */
export const USDC_ARBITRUM = {
    name: "USD Coin",
    version: "2",
    chainId: 42161,
    verifyingContract: Address.fromHex("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
};
/**
 * DAI Mainnet (Ethereum)
 */
export const DAI_MAINNET = {
    name: "Dai Stablecoin",
    version: "1",
    chainId: 1,
    verifyingContract: Address.fromHex("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
};
/**
 * USDT Mainnet (Ethereum) - Note: USDT uses EIP-2612 on mainnet
 */
export const USDT_MAINNET = {
    name: "Tether USD",
    version: "1",
    chainId: 1,
    verifyingContract: Address.fromHex("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
};
/**
 * UNI Mainnet (Ethereum)
 */
export const UNI_MAINNET = {
    name: "Uniswap",
    version: "1",
    chainId: 1,
    verifyingContract: Address.fromHex("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"),
};
/**
 * WETH Mainnet (Ethereum)
 */
export const WETH_MAINNET = {
    name: "Wrapped Ether",
    version: "1",
    chainId: 1,
    verifyingContract: Address.fromHex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
};
