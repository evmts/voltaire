# Test Client Requirements

Extracted from viem source code analysis.

## createTestClient Factory

- Parameters: `{ chain, transport, mode, key?, name? }`
- mode: `'anvil' | 'hardhat' | 'ganache'`
- Returns client with mode property and test actions bound

## Test Actions

### Mining
- `mine({ blocks, interval? })` - Mine N blocks with optional interval
  - Ganache: `evm_mine` with `{ blocks: hex }`
  - Anvil/Hardhat: `${mode}_mine` with `[blocksHex, intervalHex]`

### State Manipulation
- `setBalance({ address, value })` - Set account balance
  - Ganache: `evm_setAccountBalance`
  - Anvil/Hardhat: `${mode}_setBalance`

- `setCode({ address, bytecode })` - Set contract code
  - Ganache: `evm_setAccountCode`
  - Anvil/Hardhat: `${mode}_setCode`

- `setStorageAt({ address, index, value })` - Set storage slot
  - All modes: `${mode}_setStorageAt`

- `setNonce({ address, nonce })` - Set account nonce
  - All modes: `${mode}_setNonce`

### Account Impersonation
- `impersonateAccount({ address })` - Impersonate address
  - All modes: `${mode}_impersonateAccount`

- `stopImpersonatingAccount({ address })` - Stop impersonating
  - All modes: `${mode}_stopImpersonatingAccount`

### Snapshots
- `snapshot()` - Create EVM snapshot, returns id
  - All modes: `evm_snapshot`

- `revert({ id })` - Revert to snapshot
  - All modes: `evm_revert`

### Time Manipulation
- `increaseTime({ seconds })` - Advance time
  - All modes: `evm_increaseTime`

- `setNextBlockTimestamp({ timestamp })` - Set next block timestamp
  - All modes: `evm_setNextBlockTimestamp`

### Transaction Pool
- `dropTransaction({ hash })` - Remove tx from mempool
  - All modes: `${mode}_dropTransaction`

### Fork Management
- `reset({ blockNumber?, jsonRpcUrl? })` - Reset fork state
  - All modes: `${mode}_reset` with `{ forking: { blockNumber, jsonRpcUrl } }`

### State Serialization
- `dumpState()` - Serialize state to hex string
  - All modes: `${mode}_dumpState`

- `loadState({ state })` - Load serialized state
  - All modes: `${mode}_loadState`

### Automine
- `setAutomine(enabled)` - Enable/disable automine
  - Ganache: `miner_start` / `miner_stop`
  - Anvil/Hardhat: `evm_setAutomine`

## RPC Method Prefixes

| Method | Anvil | Hardhat | Ganache |
|--------|-------|---------|---------|
| mine | `anvil_mine` | `hardhat_mine` | `evm_mine` |
| setBalance | `anvil_setBalance` | `hardhat_setBalance` | `evm_setAccountBalance` |
| setCode | `anvil_setCode` | `hardhat_setCode` | `evm_setAccountCode` |
| setStorageAt | `anvil_setStorageAt` | `hardhat_setStorageAt` | `hardhat_setStorageAt` |
| setNonce | `anvil_setNonce` | `hardhat_setNonce` | N/A |
| impersonate | `anvil_impersonateAccount` | `hardhat_impersonateAccount` | N/A |
| reset | `anvil_reset` | `hardhat_reset` | N/A |
| snapshot | `evm_snapshot` | `evm_snapshot` | `evm_snapshot` |
| revert | `evm_revert` | `evm_revert` | `evm_revert` |
| increaseTime | `evm_increaseTime` | `evm_increaseTime` | `evm_increaseTime` |
| setNextBlockTimestamp | `evm_setNextBlockTimestamp` | `evm_setNextBlockTimestamp` | `evm_setNextBlockTimestamp` |

## Type Requirements

- All numeric values sent as hex strings (using `numberToHex`)
- Addresses as checksummed hex strings
- Bytecode/storage values as hex strings
- Snapshot IDs returned and accepted as hex strings
