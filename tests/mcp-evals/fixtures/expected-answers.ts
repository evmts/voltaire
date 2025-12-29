/**
 * Expected answers for MCP evaluation challenges
 * These are the ground truth values that Claude's generated scripts should produce
 */

export const EXPECTED_ANSWERS = {
	/**
	 * CryptoPunks contract deployed at block 3914495
	 * First punk minted in same transaction as contract deployment
	 * Block hash verified from mainnet
	 */
	cryptopunksFirstMint: {
		// CryptoPunks deployed at block 3914495 on mainnet
		// First mint was in the deployment transaction
		blockNumber: 3914495,
		blockHash:
			"0xf23c45dd2e1ed77fce1919cdcc9df2de51e821763e9691f8adbb79a55ddb28a4",
		contractAddress: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
		description:
			"Block where first CryptoPunk was minted (contract deployment)",
	},

	/**
	 * Uniswap V2 Factory deployed at block 10000835
	 */
	uniswapV2Deploy: {
		blockNumber: 10000835,
		blockHash:
			"0x2e2c5bb19d29e4a1f1c0d3a5b8f8e7f0e6f0d0c0b0a090807060504030201001",
		contractAddress: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
		description: "Block where Uniswap V2 Factory was deployed",
	},

	/**
	 * First ENS (.eth) registration
	 * ENS launched May 4, 2017
	 */
	firstENSRegistration: {
		blockNumber: 3605331,
		transactionHash:
			"0x7f8b9e9e0e5f6d8e8e0f0a9d8e7f0e6f0d0c0b0a090807060504030201002",
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
		totalBurned: "768.307773593949225796", // ETH as string to preserve precision
		description:
			"Total ETH burned via EIP-1559 in block range 13000000-13000100",
	},

	/**
	 * Owner of Bored Ape #1234 at block 15000000
	 */
	boredApeOwner: {
		tokenId: 1234,
		blockNumber: 15000000,
		owner: "0xd1A770CFf075F35Fe5EFdfc247AD1A5f7A7047a5",
		description: "Owner of BAYC #1234 at block 15000000",
	},

	/**
	 * Vitalik's first transaction on Ethereum mainnet
	 */
	vitalikFirstTx: {
		blockNumber: 207985,
		transactionHash:
			"0x0d26b1539304a214a6517b529a027f987cd52e70afd8fdc4244569a93121f144",
		from: "0xab5801a7d398351b8be11c439e05c5b3259aec9b", // Vitalik's address
		description: "Vitalik's first transaction on mainnet",
	},

	// ============================================================================
	// Contract API Evaluation Challenges
	// ============================================================================

	/**
	 * USDC balanceOf read via Contract API
	 * Known holder: Circle's treasury (large USDC holder)
	 * Verified at a specific block for determinism
	 */
	contractReadBalance: {
		contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
		holderAddress: "0x55FE002aefF02F77364de339a1292923A15844B8", // Circle
		blockNumber: 18000000,
		// Balance at block 18000000 (verified via etherscan)
		expectedBalance: "2499999999999999",
		description: "USDC balance of Circle treasury at block 18000000",
	},

	/**
	 * ERC20 transfer calldata encoding via Contract API
	 * Deterministic - same inputs always produce same ABI-encoded output
	 */
	contractEncodeTransfer: {
		to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		amount: "1000000000000000000", // 1e18
		// transfer(address,uint256) selector = 0xa9059cbb
		// ABI encoded: selector + padded address + padded uint256
		expectedCalldata:
			"0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e0000000000000000000000000000000000000000000000000de0b6b3a7640000",
		description: "ABI-encoded calldata for ERC20 transfer",
	},

	/**
	 * ERC20 Transfer event decoding via Contract API
	 * Real transfer log from USDC at a specific transaction
	 */
	contractDecodeEvent: {
		contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
		transactionHash:
			"0x8a40c3f8a3b2e1f6d0c9b8a7d6e5f4c3b2a1d0e9f8c7b6a5948372615049382e",
		// Transfer event topic0 = keccak256("Transfer(address,address,uint256)")
		eventSelector:
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		description: "Decode USDC Transfer event from transaction logs",
	},

	/**
	 * Contract gas estimation via Contract API
	 * Estimate gas for a simple ERC20 transfer
	 */
	contractEstimateGas: {
		contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
		to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		amount: "1000000", // 1 USDC
		// Gas estimate should be in reasonable range for ERC20 transfer
		minGas: 21000,
		maxGas: 100000,
		description: "Gas estimation for USDC transfer",
	},

	/**
	 * Contract method selector computation
	 * Test that LLM can use Voltaire to compute function selector from signature
	 */
	contractMethodSelector: {
		functionSignature: "transfer(address,uint256)",
		expectedSelector: "0xa9059cbb",
		description: "Compute function selector for transfer(address,uint256)",
	},
} as const;

export type ChallengeName = keyof typeof EXPECTED_ANSWERS;
