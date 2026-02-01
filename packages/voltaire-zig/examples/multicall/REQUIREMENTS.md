# Multicall Requirements

Extracted from viem implementation analysis.

## Multicall3 Contract

**Canonical Address**: `0xca11bde05977b3631167028862be2a173976ca11`
- Deployed at same address on all supported chains
- Source: https://github.com/mds1/multicall

### Core Functions

#### aggregate3(calls)
```solidity
struct Call3 {
    address target;      // Contract to call
    bool allowFailure;   // Allow call to fail
    bytes callData;      // Encoded function call
}

struct Result {
    bool success;        // Whether call succeeded
    bytes returnData;    // Return data or revert reason
}

function aggregate3(Call3[] calldata calls)
    external
    view
    returns (Result[] memory returnData);
```

#### aggregate3Value(calls) - with ETH value
```solidity
struct Call3Value {
    address target;
    bool allowFailure;
    uint256 value;       // ETH to send
    bytes callData;
}

function aggregate3Value(Call3Value[] calldata calls)
    external
    payable
    returns (Result[] memory returnData);
```

#### Utility Functions
- `getBlockNumber()` - Current block number
- `getCurrentBlockTimestamp()` - Current block timestamp
- `getEthBalance(address)` - ETH balance of address

## Implementation Requirements

### Parameters
- `contracts[]` - Array of contract calls:
  - `address` - Contract address
  - `abi` - Contract ABI (full or single function)
  - `functionName` - Function to call
  - `args` - Function arguments
- `allowFailure` - Global allow failure (default: true)
- `blockNumber` - Block to query at (optional)
- `blockTag` - Block tag: 'latest', 'pending', 'safe', etc.
- `multicallAddress` - Override default Multicall3 address
- `batchSize` - Max calldata bytes per batch (default: 1024)

### Return Format

When `allowFailure: true` (default):
```typescript
type Result =
  | { status: 'success'; result: DecodedValue }
  | { status: 'failure'; error: Error; result: undefined }
```

When `allowFailure: false`:
```typescript
type Result = DecodedValue  // Throws on any failure
```

### Error Handling

1. **Encoding errors**: If a contract call can't be encoded
   - With `allowFailure: true`: Add placeholder `0x` callData, mark as failure
   - With `allowFailure: false`: Throw immediately

2. **RPC errors**: If eth_call itself fails
   - With `allowFailure: true`: Mark all calls in batch as failure
   - With `allowFailure: false`: Throw

3. **Per-call failures**: If individual call reverts
   - With `allowFailure: true`: Parse revert data, mark as failure
   - With `allowFailure: false`: Throw with contract error

4. **Zero data decoding**: If call returns empty data
   - Treat as failure (AbiDecodingZeroDataError)

### Batching

- Split calls into chunks based on `batchSize` (calldata bytes)
- Execute chunks in parallel via Promise.allSettled
- Maintain original order in results

### Deployless Mode

- Deploy Multicall3 bytecode inline via eth_call `code` parameter
- Useful for chains without deployed Multicall3
- bytecode stored in constants

## Supported Chains

All EVM chains at address `0xca11bde05977b3631167028862be2a173976ca11`:
- Mainnet, Goerli, Sepolia
- Polygon, Mumbai
- Arbitrum One, Nova
- Optimism, Base
- BSC, Avalanche
- Fantom, Cronos
- Gnosis, Celo
- And 40+ more

Some chains have different deployment blocks (for historical queries).

## Key Differences from viem

Voltaire implementation:
1. Uses Voltaire primitives (Address, Abi, Hex)
2. Simpler client interface (just provider)
3. Focus on copyable/customizable code
4. Detailed JSDoc for discoverability
