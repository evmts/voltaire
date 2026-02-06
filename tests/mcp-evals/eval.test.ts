import { beforeAll, describe, expect, it } from "vitest";
import { EXPECTED_ANSWERS } from "./fixtures/expected-answers.js";
import { runClaudeEval } from "./utils/runClaudeEval.js";

// MCP server URL - default to deployed, allow override for local testing
const MCP_SERVER_URL =
	process.env.MCP_SERVER_URL || "https://voltaire.tevm.sh/mcp";

// RPC endpoint from environment
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;

describe("Voltaire MCP Evaluations", () => {
	beforeAll(() => {
		if (!ETHEREUM_RPC_URL) {
			throw new Error(
				"ETHEREUM_RPC_URL environment variable is required for MCP evaluations",
			);
		}
	});

	describe("Blockchain Data Challenges", () => {
		it(
			"should find the block hash where the first CryptoPunk was minted",
			{ timeout: 12 * 60 * 1000 },
			async () => {
				const result = await runClaudeEval({
					prompt: `Find the block hash where the first CryptoPunk NFT was minted.

The CryptoPunks contract address is ${EXPECTED_ANSWERS.cryptopunksFirstMint.contractAddress}.

Return the block hash in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					rpcUrl: ETHEREUM_RPC_URL,
					maxTurns: 15,
					timeoutMs: 10 * 60 * 1000, // give more time for block search
				});

				// Verify the script executed successfully
				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();

				// Verify the answer is correct
				expect(result.scriptOutput?.toLowerCase()).toBe(
					EXPECTED_ANSWERS.cryptopunksFirstMint.blockHash.toLowerCase(),
				);
			},
		);

		it(
			"should find the block number where Uniswap V2 Factory was deployed",
			{ timeout: 6 * 60 * 1000 },
			async () => {
				const result = await runClaudeEval({
					prompt: `Find the block number where the Uniswap V2 Factory contract was deployed.

The Uniswap V2 Factory contract address is ${EXPECTED_ANSWERS.uniswapV2Deploy.contractAddress}.

Return the block number in your final message as: ANSWER: <block_number>`,
					mcpServerUrl: MCP_SERVER_URL,
					rpcUrl: ETHEREUM_RPC_URL,
					maxTurns: 15,
					timeoutMs: 5 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();

				// Parse and verify block number
				const blockNumber = Number.parseInt(result.scriptOutput || "", 10);
				expect(blockNumber).toBe(EXPECTED_ANSWERS.uniswapV2Deploy.blockNumber);
			},
		);

		it(
			"should find Vitalik's first transaction on mainnet",
			{ timeout: 6 * 60 * 1000 },
			async () => {
				const result = await runClaudeEval({
					prompt: `Find the transaction hash of Vitalik Buterin's first transaction on Ethereum mainnet.

Vitalik's address is ${EXPECTED_ANSWERS.vitalikFirstTx.from}.

Return the transaction hash in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					rpcUrl: ETHEREUM_RPC_URL,
					maxTurns: 15,
					timeoutMs: 5 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();

				expect(result.scriptOutput?.toLowerCase()).toBe(
					EXPECTED_ANSWERS.vitalikFirstTx.transactionHash.toLowerCase(),
				);
			},
		);

		it(
			"should calculate total ETH burned in a block range (EIP-1559)",
			{ timeout: 11 * 60 * 1000 },
			async () => {
				const { startBlock, endBlock, totalBurned } =
					EXPECTED_ANSWERS.ethBurnedRange;

				const result = await runClaudeEval({
					prompt: `Calculate the total amount of ETH burned via EIP-1559 between blocks ${startBlock} and ${endBlock} (inclusive).

Use the formula: burned = baseFeePerGas * gasUsed

Sum this for all blocks in the range and return the total in ETH (not wei).

Return the total in your final message as: ANSWER: <eth_amount>`,
					mcpServerUrl: MCP_SERVER_URL,
					rpcUrl: ETHEREUM_RPC_URL,
					maxTurns: 20,
					timeoutMs: 10 * 60 * 1000, // 10 minutes for this more complex task
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();

				// Parse and verify ETH amount (allow small floating point differences)
				const burned = Number.parseFloat(result.scriptOutput || "0");
				const expected = Number.parseFloat(totalBurned);
				expect(Math.abs(burned - expected)).toBeLessThan(0.000001); // 1 wei tolerance
			},
		);

		it(
			"should find the owner of a specific NFT at a specific block",
			{ timeout: 6 * 60 * 1000 },
			async () => {
				const { tokenId, blockNumber, owner } = EXPECTED_ANSWERS.boredApeOwner;
				const BAYC_CONTRACT = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

				const result = await runClaudeEval({
					prompt: `Find the owner of Bored Ape Yacht Club NFT #${tokenId} at block ${blockNumber}.

The BAYC contract address is ${BAYC_CONTRACT}.

Return the owner address in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					rpcUrl: ETHEREUM_RPC_URL,
					maxTurns: 15,
					timeoutMs: 5 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();

				expect(result.scriptOutput?.toLowerCase()).toBe(owner.toLowerCase());
			},
		);

		it(
			"should find the first ENS name ever registered",
			{ timeout: 11 * 60 * 1000 },
			async () => {
				const { ensName } = EXPECTED_ANSWERS.firstENSRegistration;

				const result = await runClaudeEval({
					prompt: `Find the first .eth ENS name that was ever registered on Ethereum mainnet.

ENS launched in May 2017. Find the first registration transaction.

Return the ENS name in your final message as: ANSWER: <name>.eth`,
					mcpServerUrl: MCP_SERVER_URL,
					rpcUrl: ETHEREUM_RPC_URL,
					maxTurns: 20,
					timeoutMs: 10 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();

				expect(result.scriptOutput?.toLowerCase()).toBe(ensName.toLowerCase());
			},
		);
	});

	describe("Contract API Challenges", () => {
		it(
			"should read ERC20 balance using Voltaire Contract API",
			{ timeout: 6 * 60 * 1000 },
			async () => {
				const { contractAddress, holderAddress, blockNumber } =
					EXPECTED_ANSWERS.contractReadBalance;

				const result = await runClaudeEval({
					prompt: `Use Voltaire's Contract module to read the USDC balance of an address.

Contract Address (USDC): ${contractAddress}
Holder Address: ${holderAddress}
Block Number: ${blockNumber}

Create a Contract instance with the ERC20 ABI (at minimum: balanceOf function).
Call contract.read.balanceOf() at the specified block.

Return the balance as a string in your final message as: ANSWER: <balance>`,
					mcpServerUrl: MCP_SERVER_URL,
					rpcUrl: ETHEREUM_RPC_URL,
					maxTurns: 15,
					timeoutMs: 5 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				// Balance should be a valid numeric string
				expect(result.scriptOutput).toMatch(/^\d+$/);
			},
		);

		it(
			"should encode ERC20 transfer calldata using Voltaire Contract/ABI",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const { to, amount, expectedCalldata } =
					EXPECTED_ANSWERS.contractEncodeTransfer;

				const result = await runClaudeEval({
					prompt: `Use Voltaire's ABI or Contract module to encode calldata for an ERC20 transfer.

Function: transfer(address to, uint256 amount)
To Address: ${to}
Amount: ${amount} (as bigint/wei)

Encode the function call and return the hex-encoded calldata.

Return the calldata in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				expect(result.scriptOutput?.toLowerCase()).toBe(
					expectedCalldata.toLowerCase(),
				);
			},
		);

		it(
			"should compute function selector using Voltaire",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const { functionSignature, expectedSelector } =
					EXPECTED_ANSWERS.contractMethodSelector;

				const result = await runClaudeEval({
					prompt: `Use Voltaire to compute the 4-byte function selector for: ${functionSignature}

The selector is the first 4 bytes of keccak256 hash of the function signature.

Return the selector in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				expect(result.scriptOutput?.toLowerCase()).toBe(
					expectedSelector.toLowerCase(),
				);
			},
		);

		it(
			"should create Contract instance and access ABI methods",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const result = await runClaudeEval({
					prompt: `Use Voltaire's Contract module to:

1. Create a Contract instance for USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
2. Include a minimal ERC20 ABI with: name, symbol, decimals, balanceOf, transfer, Transfer event
3. Verify the contract has read.balanceOf and write.transfer methods available

Return "success" if the Contract was created correctly with the expected methods.

Return in your final message as: ANSWER: success`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				expect(result.scriptOutput?.toLowerCase()).toBe("success");
			},
		);

		it(
			"should decode Transfer event topics using Voltaire",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const { eventSelector } = EXPECTED_ANSWERS.contractDecodeEvent;

				const result = await runClaudeEval({
					prompt: `Use Voltaire to verify the event selector for ERC20 Transfer event.

The Transfer event signature is: Transfer(address indexed from, address indexed to, uint256 value)

Compute the keccak256 hash of "Transfer(address,address,uint256)" and return the first 32 bytes as the event topic.

Return the topic in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				expect(result.scriptOutput?.toLowerCase()).toBe(
					eventSelector.toLowerCase(),
				);
			},
		);
	});

	describe("Crypto & Primitives Challenges", () => {
		it(
			"should verify a secp256k1 signature using Voltaire",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const message = "Hello Voltaire!";
				const signature =
					"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00";
				const publicKey =
					"0x04abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

				const result = await runClaudeEval({
					prompt: `Use Voltaire's Secp256k1 module to verify this signature:

Message: "${message}"
Signature: ${signature}
Public Key: ${publicKey}

Return "valid" or "invalid" in your final message as: ANSWER: <valid|invalid>`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				expect(["valid", "invalid"]).toContain(
					result.scriptOutput?.toLowerCase(),
				);
			},
		);

		it(
			"should compute keccak256 hash using Voltaire",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const input = "0x1234567890abcdef";
				// Expected hash of the input (precomputed)
				const expectedHash =
					"0xed8ab4fde4c4e2749641d9d89de3d920f9845e086abd71e6921319f41f0e784f";

				const result = await runClaudeEval({
					prompt: `Use Voltaire's Keccak256 module to compute the keccak256 hash of: ${input}

Return the hash in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				expect(result.scriptOutput?.toLowerCase()).toBe(
					expectedHash.toLowerCase(),
				);
			},
		);

		it(
			"should convert between Hex and Address using Voltaire",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const hexValue = "0x1234567890123456789012345678901234567890";

				const result = await runClaudeEval({
					prompt: `Use Voltaire's Address module to validate and checksum this address: ${hexValue}

Return the checksummed address in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				// Should return a valid checksummed address
				expect(result.scriptOutput).toMatch(/^0x[a-fA-F0-9]{40}$/);
			},
		);
	});

	describe("BlockStream API Challenges", () => {
		it(
			"should understand BlockStream backfill API",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const { fromBlock, toBlock, expectedBlockCount } =
					EXPECTED_ANSWERS.blockStreamBackfill;

				const result = await runClaudeEval({
					prompt: `Use Voltaire's BlockStream module to write code that backfills blocks.

Write TypeScript code that:
1. Creates a BlockStream with a provider
2. Calls stream.backfill() with fromBlock=${fromBlock}n and toBlock=${toBlock}n
3. Counts the total number of blocks received

The code should use async iteration: for await (const event of stream.backfill(...))

Return the expected number of blocks in your final message as: ANSWER: <count>`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				const count = Number.parseInt(result.scriptOutput || "0", 10);
				expect(count).toBe(expectedBlockCount);
			},
		);

		it(
			"should understand BlockStream reorg event handling",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const { eventTypes, reorgProperties } =
					EXPECTED_ANSWERS.blockStreamReorgHandling;

				const result = await runClaudeEval({
					prompt: `Explain how to handle chain reorganizations with Voltaire's BlockStream.

Using the BlockStream watch() method, describe:
1. What event types can be emitted (list them)
2. What properties are available on a reorg event

Return the event types as comma-separated values in your final message as: ANSWER: <type1>,<type2>`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();

				const types = result.scriptOutput
					?.split(",")
					.map((t) => t.trim().toLowerCase());
				expect(types).toContain("blocks");
				expect(types).toContain("reorg");
			},
		);

		it(
			"should understand BlockStream include options",
			{ timeout: 4 * 60 * 1000 },
			async () => {
				const { options } = EXPECTED_ANSWERS.blockStreamIncludeOptions;

				const result = await runClaudeEval({
					prompt: `What are the three 'include' options available for BlockStream's backfill and watch methods?

These options control how much block data is fetched (just headers, with transactions, or with receipts).

Return the options as comma-separated values in your final message as: ANSWER: <option1>,<option2>,<option3>`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 10,
					timeoutMs: 3 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();

				const returnedOptions = result.scriptOutput
					?.split(",")
					.map((o) => o.trim().toLowerCase());
				for (const opt of options) {
					expect(returnedOptions).toContain(opt);
				}
			},
		);

		it(
			"should write BlockStream watch code with reorg handling",
			{ timeout: 5 * 60 * 1000 },
			async () => {
				const result = await runClaudeEval({
					prompt: `Write TypeScript code using Voltaire's BlockStream to watch for new blocks and handle reorgs.

The code should:
1. Create a BlockStream with a provider
2. Use stream.watch() with an AbortSignal
3. Handle both 'blocks' and 'reorg' event types
4. For reorg events, iterate over event.removed to rollback state

Return "success" if you can write valid code that handles both event types.

Return in your final message as: ANSWER: success`,
					mcpServerUrl: MCP_SERVER_URL,
					maxTurns: 15,
					timeoutMs: 4 * 60 * 1000,
				});

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
				expect(result.scriptOutput).toBeDefined();
				expect(result.scriptOutput?.toLowerCase()).toBe("success");
			},
		);
	});
});
