# Integration Tests

Integration tests that validate Voltaire against real blockchain infrastructure.

## Fork Read Tests

Validates Milestone 1 acceptance criteria using real Alchemy RPC endpoint.

### Requirements

- **ALCHEMY_RPC environment variable** - Mainnet Alchemy RPC URL with API key

### Running Tests

```bash
# Set environment variable
export ALCHEMY_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Run integration tests
pnpm test:run tests/integration/fork-read.test.ts
```

Or run in one command:

```bash
ALCHEMY_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY pnpm test:run tests/integration/fork-read.test.ts
```

### Tests Included

1. **eth_getBalance** - Read Vitalik's balance from mainnet
2. **eth_getCode** - Read USDC contract code
3. **eth_getStorageAt** - Read USDC storage slot (implementation address)
4. **eth_blockNumber** - Get current block number
5. **eth_getBlockByNumber** - Fetch block 18000000

All 5 tests must pass for Milestone 1 completion.

### Getting Alchemy API Key

1. Sign up at https://www.alchemy.com/
2. Create a new app (Ethereum Mainnet)
3. Copy the HTTPS URL from dashboard
4. Use it as ALCHEMY_RPC value

### Notes

- Tests are skipped if ALCHEMY_RPC not set
- Tests use real mainnet data (not mocks)
- Tests validate actual blockchain state
- Timeout: 30 seconds per test
