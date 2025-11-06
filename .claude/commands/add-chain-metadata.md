# Add Chain Metadata Functions

**Priority: LOW**

Chain primitive exists but missing metadata helpers.

## Task
Add chain information and utility methods.

## Functions to Add

### Basic Info
```typescript
getName(chain): string
  // Get chain name (e.g., "Ethereum Mainnet")

getShortName(chain): string
  // Get short name (e.g., "eth")

getSymbol(chain): string
  // Get native currency symbol (e.g., "ETH")
```

### Network Info
```typescript
getRpcUrl(chain): string | string[]
  // Get default RPC URL(s)

getExplorerUrl(chain): string
  // Get block explorer URL

getWebsocketUrl(chain): string | undefined
  // Get WebSocket URL if available
```

### Classification
```typescript
isTestnet(chain): boolean
  // Check if testnet

isL2(chain): boolean
  // Check if Layer 2

getL1Chain(chain): Chain | undefined
  // Get parent L1 chain if L2
```

### Hardfork Info
```typescript
getLatestHardfork(chain): Hardfork
  // Get latest active hardfork

getHardforkBlock(chain, hardfork): number | undefined
  // Get activation block for hardfork

supportsHardfork(chain, hardfork): boolean
  // Check if hardfork supported
```

### Constants
```typescript
getBlockTime(chain): number
  // Average block time in seconds

getGasLimit(chain): number
  // Block gas limit
```

## Data Source
May need chain metadata JSON or built-in constants for popular chains.

## Files
Add to `src/primitives/Chain/` namespace.

## Verification
```bash
bun run test -- Chain
```
