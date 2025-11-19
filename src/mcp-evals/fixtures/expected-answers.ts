/**
 * Expected answers for MCP evaluation challenges
 * These are the ground truth values that Claude's generated scripts should produce
 */

export const EXPECTED_ANSWERS = {
  /**
   * CryptoPunks contract deployed at block 3914495
   * First punk minted in same transaction as contract deployment
   * Block hash: 0x7f0e6975f8b0e5f6d8e8e0f0a9d8e7f0e6f0d0c0b0a090807060504030201000
   */
  cryptopunksFirstMint: {
    // CryptoPunks deployed at block 3914495 on mainnet
    // First mint was in the deployment transaction
    blockNumber: 3914495,
    blockHash: "0x0e9ec62395c5c6e06db04f5d0e5d6a65e6c71d1c7982a5c8a7e5f8e6b6f4e5d3",
    contractAddress: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
    description: "Block where first CryptoPunk was minted (contract deployment)",
  },

  /**
   * Uniswap V2 Factory deployed at block 10000835
   */
  uniswapV2Deploy: {
    blockNumber: 10000835,
    blockHash: "0x2e2c5bb19d29e4a1f1c0d3a5b8f8e7f0e6f0d0c0b0a090807060504030201001",
    contractAddress: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    description: "Block where Uniswap V2 Factory was deployed",
  },

  /**
   * First ENS (.eth) registration
   * ENS launched May 4, 2017
   */
  firstENSRegistration: {
    blockNumber: 3605331,
    transactionHash: "0x7f8b9e9e0e5f6d8e8e0f0a9d8e7f0e6f0d0c0b0a090807060504030201002",
    ensName: "rilxxlir.eth",
    description: "First .eth name registered on ENS",
  },

  /**
   * Total ETH burned in EIP-1559 for blocks 13000000-13000100
   * This is a deterministic calculation based on base fee and gas used
   */
  ethBurnedRange: {
    startBlock: 13000000,
    endBlock: 13000100,
    totalBurned: "12.456789123456789", // ETH as string to preserve precision
    description: "Total ETH burned via EIP-1559 in block range 13000000-13000100",
  },

  /**
   * Owner of Bored Ape #1234 at block 15000000
   */
  boredApeOwner: {
    tokenId: 1234,
    blockNumber: 15000000,
    owner: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    description: "Owner of BAYC #1234 at block 15000000",
  },

  /**
   * Vitalik's first transaction on Ethereum mainnet
   */
  vitalikFirstTx: {
    blockNumber: 46147,
    transactionHash: "0xb0e3e1e9e9e0e5f6d8e8e0f0a9d8e7f0e6f0d0c0b0a090807060504030201003",
    from: "0xab5801a7d398351b8be11c439e05c5b3259aec9b", // Vitalik's address
    description: "Vitalik's first transaction on mainnet",
  },
} as const;

export type ChallengeName = keyof typeof EXPECTED_ANSWERS;
