# Chain Examples

Comprehensive examples demonstrating Chain primitive usage for Ethereum network configuration and metadata.

## TypeScript Examples

All examples available in this directory demonstrate the Chain API:

1. **basic-lookup.ts** - Chain lookup by ID and basic metadata access
2. **network-metadata.ts** - Accessing RPC endpoints, explorers, and currency info
3. **multi-chain-support.ts** - Building multi-chain applications with validation
4. **network-detection.ts** - Detecting mainnet/testnet, L1/L2 classification
5. **gas-comparison.ts** - Comparing transaction costs across networks
6. **chain-validation.ts** - Validating chain IDs with type-safe patterns
7. **rpc-management.ts** - Managing RPC endpoints with fallback strategies
8. **chain-registry.ts** - Exploring and searching the chain registry

## Running Examples

```bash
# Run individual example
bun run examples/primitives/chain/basic-lookup.ts

# Run all chain examples
for f in examples/primitives/chain/*.ts; do bun run "$f"; done
```

## Zig Implementation

**Note:** Chain is TypeScript-only and does not have a Zig implementation.

### Why No Zig Version?

Chain is a lightweight wrapper around [@tevm/chains](https://github.com/evmts/tevm-monorepo/tree/main/packages/chains), a JavaScript package containing 800+ chain configurations. This data:

- Comes from external sources (chainlist.org)
- Is maintained as JSON/JavaScript objects
- Changes frequently with new chains and updates
- Includes dynamic data (RPC URLs, explorers, etc.)

The Chain primitive is fundamentally different from other primitives (Address, Hash, Hex, etc.) which are:
- Pure computational transformations
- Statically defined algorithms
- Independent of external data sources

### Architecture Pattern

```
TypeScript Layer (Chain)
├── Wraps @tevm/chains data
├── Provides convenient API
└── Zero crypto/computation

Zig Layer (Other Primitives)
├── Pure algorithms (keccak256, secp256k1)
├── Data transformations (hex, RLP, ABI)
└── Performance-critical operations
```

### Alternative Approach

If you need chain configuration in Zig:

1. **Hardcode specific chains**:
   ```zig
   const ChainConfig = struct {
       id: u64,
       name: []const u8,
       // ... other fields
   };

   const MAINNET = ChainConfig{
       .id = 1,
       .name = "Ethereum Mainnet",
   };
   ```

2. **Load at runtime**:
   ```zig
   // Read chain data from JSON file
   const chain_data = try std.fs.cwd().readFileAlloc(allocator, "chains.json", max_size);
   const parsed = try std.json.parseFromSlice(ChainConfig, allocator, chain_data, .{});
   ```

3. **FFI to TypeScript**:
   ```zig
   extern fn getChainById(id: u64) ?*ChainConfig;
   ```

## Key Concepts

### Chain Lookup
```typescript
import { Chain } from '@tevm/voltaire';

// By ID
const mainnet = Chain.fromId(1);
const optimism = Chain.fromId(10);

// By record
const arbitrum = Chain.byId[42161];
```

### Metadata Access
```typescript
const chain = Chain.fromId(9)!;

console.log(chain.name);                    // "Quai Mainnet"
console.log(chain.chainId);                 // 9
console.log(chain.nativeCurrency.symbol);   // "QUAI"
console.log(chain.rpc[0]);                  // RPC endpoint
console.log(chain.explorers?.[0]?.url);     // Block explorer
```

### Multi-Chain Support
```typescript
const SUPPORTED_CHAINS = [1, 10, 42161, 8453];

function isSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.includes(chainId);
}

function getSupportedChains() {
  return SUPPORTED_CHAINS
    .map(id => Chain.fromId(id))
    .filter((c): c is Chain => c !== undefined);
}
```

### Network Detection
```typescript
function detectType(chainId: number): 'mainnet' | 'testnet' {
  const chain = Chain.fromId(chainId);
  if (!chain) return 'unknown';

  const name = chain.name.toLowerCase();
  if (name.includes('testnet') || name.includes('sepolia')) {
    return 'testnet';
  }
  return 'mainnet';
}
```

### Gas Comparison
```typescript
function calculateCost(chainId: number, gas: bigint): bigint {
  const gasPriceGwei = getGasPrice(chainId); // 50n for mainnet, 1n for L2s
  const gasPriceWei = gasPriceGwei * 1_000_000_000n;
  return gasPriceWei * gas;
}

const mainnetCost = calculateCost(1, 21_000n);
const arbitrumCost = calculateCost(42161, 21_000n);
// L2 is ~50x cheaper
```

### RPC Management
```typescript
async function callWithFallback<T>(
  chainId: number,
  call: (url: string) => Promise<T>
): Promise<T> {
  const rpcs = Chain.fromId(chainId)?.rpc ?? [];

  for (const rpc of rpcs) {
    try {
      return await call(rpc);
    } catch {
      continue; // Try next RPC
    }
  }

  throw new Error('All RPCs failed');
}
```

## Related Documentation

- [Chain API Docs](/primitives/chain) - Complete API reference
- [Chain Constructors](/primitives/chain/constructors) - Creating chains
- [Chain Lookup](/primitives/chain/chain-lookup) - Lookup methods
- [Chain Metadata](/primitives/chain/metadata) - Accessing properties
- [Network Comparison](/primitives/chain/network-comparison) - Gas costs and characteristics

## Data Source

Chain data comes from [@tevm/chains](https://github.com/evmts/tevm-monorepo/tree/main/packages/chains), which aggregates chain configurations from:
- [chainlist.org](https://chainlist.org) - Community-maintained chain registry
- [ethereum-lists/chains](https://github.com/ethereum-lists/chains) - GitHub chain database

Data includes:
- 800+ EVM-compatible chains
- Mainnets, testnets, L2s, sidechains
- RPC endpoints, block explorers
- Native currency details
- Network metadata
