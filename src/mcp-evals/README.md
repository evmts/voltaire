# Voltaire MCP Evaluation Tests

Advent-of-Code style evaluation suite testing Claude's ability to use the Voltaire MCP server to solve Ethereum-related challenges.

## Setup

### 1. Install Dependencies

```bash
bun install
```

This will install `@anthropic-ai/claude-agent-sdk` and other required dependencies.

### 2. Configure Environment

Create a `.env` file in the project root with:

```bash
# Required: Ethereum RPC endpoint for blockchain queries
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Optional: Anthropic API key (if not using system credentials)
ANTHROPIC_API_KEY=sk-ant-...
```

**RPC Provider Options:**
- Alchemy: https://alchemy.com
- Infura: https://infura.io
- QuickNode: https://quicknode.com
- Ankr: https://ankr.com
- Or run a local node

### 3. Run Tests

```bash
# Run all MCP evals
bun test src/mcp-evals/eval.test.ts

# Run specific test
bun test src/mcp-evals/eval.test.ts -t "CryptoPunk"

# With verbose output
bun test src/mcp-evals/eval.test.ts --reporter=verbose
```

## How It Works

Each test:

1. **Defines a prompt** with a clear Ethereum challenge (e.g., "Find the block hash where first CryptoPunk was minted")
2. **Launches Claude** with access to the Voltaire MCP server at `https://voltaire.tevm.sh/mcp`
3. **Claude generates code** using Voltaire primitives to solve the challenge
4. **Executes the script** and captures the output
5. **Validates the answer** against known ground truth from `fixtures/expected-answers.ts`

## Test Categories

### Blockchain Data Challenges
- CryptoPunks first mint block
- Uniswap V2 deployment block
- Vitalik's first transaction
- EIP-1559 ETH burned calculation
- NFT ownership at specific block
- First ENS registration

### Crypto & Primitives Challenges
- Secp256k1 signature verification
- Keccak256 hash computation
- Address validation and checksumming

## Architecture

```
src/mcp-evals/
├── eval.test.ts              # Main test suite
├── utils/
│   └── runClaudeEval.ts     # Claude SDK wrapper
├── fixtures/
│   └── expected-answers.ts   # Ground truth answers
├── challenges/               # (Future) Individual challenge modules
└── README.md                # This file
```

## Key Features

- **Advent-of-Code Style**: Clear challenges with deterministic answers
- **Real Blockchain Data**: Uses live RPC to query mainnet
- **Full Validation**: Checks both script execution AND answer correctness
- **Timeout Protection**: 5-11 minute timeouts per test
- **Comprehensive Coverage**: Tests both blockchain queries and crypto primitives

## Expected Answers

All expected answers are defined in `fixtures/expected-answers.ts` with:
- The correct answer value
- Block numbers/hashes/addresses
- Descriptions of what each challenge tests

## Timeouts

- Simple queries: 3-4 minutes
- Complex calculations: 10-11 minutes
- Default max turns: 15-20 (Claude can iterate to solve)

## Troubleshooting

### "ETHEREUM_RPC_URL environment variable is required"
Set the RPC URL in your `.env` file or environment.

### "Eval timeout after Xms"
Increase `timeoutMs` in the test configuration - some challenges need more time.

### "success: false"
Check `result.error` and `result.messages` for Claude's execution logs.

## Adding New Challenges

1. Add expected answer to `fixtures/expected-answers.ts`
2. Add test case to `eval.test.ts`
3. Define clear prompt with desired output format
4. Set appropriate timeout based on complexity

## Example Challenge

```typescript
it("should find block hash where first CryptoPunk minted", async () => {
  const result = await runClaudeEval({
    prompt: `Find the block hash where the first CryptoPunk NFT was minted.

The CryptoPunks contract is ${CONTRACT_ADDRESS}.

Return: ANSWER: 0x...`,
    mcpServerUrl: "https://voltaire.tevm.sh/mcp",
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    maxTurns: 15,
    timeoutMs: 5 * 60 * 1000,
  });

  expect(result.success).toBe(true);
  expect(result.scriptOutput).toBe(EXPECTED_ANSWERS.cryptopunksFirstMint.blockHash);
});
```

## Notes

- Tests are designed to run sequentially (not parallel) due to API rate limits
- Each test may make multiple RPC calls through Claude's generated code
- Failed tests include full message logs for debugging
- MCP server must be accessible at `https://voltaire.tevm.sh/mcp`
