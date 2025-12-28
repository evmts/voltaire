import { beforeAll, describe, expect, it } from "vitest";
import { EXPECTED_ANSWERS } from "./fixtures/expected-answers.js";
import { runClaudeEval } from "./utils/runClaudeEval.js";

// MCP server URL - deployed Voltaire MCP server
const MCP_SERVER_URL = "https://voltaire.tevm.sh/mcp";

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
            { timeout: 6 * 60 * 1000 },
            async () => {
				const result = await runClaudeEval({
					prompt: `Find the block hash where the first CryptoPunk NFT was minted.

The CryptoPunks contract address is ${EXPECTED_ANSWERS.cryptopunksFirstMint.contractAddress}.

Return the block hash in your final message as: ANSWER: 0x...`,
					mcpServerUrl: MCP_SERVER_URL,
					rpcUrl: ETHEREUM_RPC_URL,
					maxTurns: 15,
					timeoutMs: 5 * 60 * 1000, // 5 minutes
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
});
