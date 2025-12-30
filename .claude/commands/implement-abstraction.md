---
allowed-tools: Bash(bun run test:*), Bash(bun typecheck:*), Bash(git:*), Read, Edit, Write, Glob, Grep, Task, TodoWrite, WebFetch
argument-hint: <abstraction-name> (e.g., "ethers-provider", "viem-publicclient")
description: Implement ethers/viem-style abstraction as copyable example with tests and docs
model: claude-sonnet-4-20250514
---

# Implement Library Abstraction

<mission>
Implement ONE high-level abstraction (ethers or viem style) as a copyable reference implementation.

**Philosophy**: Voltaire provides primitives. Higher-level abstractions are "playbooks" - reference implementations users copy and customize. See `/concepts/primitives-philosophy` and `/contract` for the pattern.

**This run implements exactly ONE abstraction.** Do not attempt multiple.
</mission>

<critical_constraints>
- **READ SOURCE CODE FIRST** - You MUST read the actual ethers/viem source before implementing
- **ONE abstraction per run** - Never implement multiple in a single session
- **Faithful implementation** - Match the original library's behavior including retries, gas estimation, error handling
- **Working tests required** - All examples must have passing unit tests
- **Documentation required** - Create playbook doc in `docs/playbooks/`
</critical_constraints>

## Available Abstractions

Parse `$ARGUMENTS` to determine which to implement:

<abstractions>
| ID | Name | Library | Source Location |
|----|------|---------|-----------------|
| 1 | `ethers-provider` | ethers v6 | `node_modules/ethers/lib.esm/providers/` |
| 2 | `ethers-signer` | ethers v6 | `node_modules/ethers/lib.esm/providers/abstract-signer.js` |
| 3 | `ethers-contract` | ethers v6 | `node_modules/ethers/lib.esm/contract/` |
| 4 | `ethers-hdwallet` | ethers v6 | `node_modules/ethers/lib.esm/wallet/hdwallet.js` |
| 5 | `ethers-interface` | ethers v6 | `node_modules/ethers/lib.esm/abi/interface.js` |
| 6 | `viem-publicclient` | viem | `node_modules/viem/_esm/clients/createPublicClient.js` |
| 7 | `viem-walletclient` | viem | `node_modules/viem/_esm/clients/createWalletClient.js` |
| 8 | `viem-account` | viem | `node_modules/viem/_esm/accounts/` |
| 9 | `viem-testclient` | viem | `node_modules/viem/_esm/clients/createTestClient.js` |
| 10 | `viem-contract` | viem | `node_modules/viem/_esm/actions/public/` + `wallet/` |
| 11 | `nonce-manager` | ethers v6 | `node_modules/ethers/lib.esm/providers/abstract-signer.js` |
| 12 | `multicall` | viem | `node_modules/viem/_esm/actions/public/multicall.js` |
| 13 | `batched-provider` | viem | `node_modules/viem/_esm/utils/promise/createBatchScheduler.js` |
</abstractions>

<batch_explanation>
**Note on `batched-provider`**: This implements automatic JSON-RPC batch request batching. Multiple concurrent requests (ANY RPC methods) are debounced and sent as a single HTTP request containing a JSON-RPC batch array.

```typescript
// Without batching: 4 separate HTTP requests
await Promise.all([
  client.getBalance(addr1),
  client.getBlockNumber(),
  client.call({ to, data }),
  client.getGasPrice(),
]);

// With batching: 1 HTTP request with JSON-RPC batch array:
// [
//   { "jsonrpc": "2.0", "id": 1, "method": "eth_getBalance", "params": [...] },
//   { "jsonrpc": "2.0", "id": 2, "method": "eth_blockNumber", "params": [] },
//   { "jsonrpc": "2.0", "id": 3, "method": "eth_call", "params": [...] },
//   { "jsonrpc": "2.0", "id": 4, "method": "eth_gasPrice", "params": [] }
// ]
const batchedClient = BatchedProvider({ provider, wait: 10 }); // 10ms debounce
await Promise.all([
  batchedClient.getBalance(addr1),
  batchedClient.getBlockNumber(),
  batchedClient.call({ to, data }),
  batchedClient.getGasPrice(),
]);
```

Key files:
- `node_modules/viem/_esm/utils/promise/createBatchScheduler.js` - Core batching logic
- `node_modules/viem/_esm/clients/createClient.js` - How batch config is used

**Note on `multicall`**: Different from batching - multicall uses a deployed contract to batch multiple `eth_call` reads into a single call. Only works for read operations and requires the Multicall3 contract.
</batch_explanation>

If `$ARGUMENTS` is empty or invalid, ASK user which abstraction to implement.

---

## Phase 0: Setup TodoWrite Tracking

Create todos for all phases:

```
[ ] Phase 1: Read source code from ethers/viem
[ ] Phase 2: Document extracted requirements
[ ] Phase 3: Create example implementation
[ ] Phase 4: Write comprehensive tests
[ ] Phase 5: Create playbook documentation
[ ] Phase 6: Verify all tests pass
[ ] Phase 7: Final review
```

---

## Phase 1: Read Source Code (MANDATORY)

<source_reading priority="BLOCKING">
**You MUST read the actual source code before ANY implementation.**

This is non-negotiable. Do not skip. Do not summarize from memory.

### Ethers v6 Source Locations

```
node_modules/ethers/lib.esm/
├── providers/
│   ├── abstract-provider.js    # Provider base class (51KB - core logic!)
│   ├── abstract-signer.js      # Signer base class
│   ├── provider-jsonrpc.js     # JSON-RPC implementation
│   ├── provider.js             # Provider utilities
│   └── network.js              # Network handling
├── contract/
│   ├── contract.js             # Contract class
│   ├── wrappers.js             # Method wrappers
│   └── types.js                # Type definitions
├── wallet/
│   ├── hdwallet.js             # HD wallet (BIP32/39)
│   ├── base-wallet.js          # Base wallet class
│   ├── mnemonic.js             # Mnemonic handling
│   └── wallet.js               # Main Wallet class
└── abi/
    ├── interface.js            # Interface class
    ├── abi-coder.js            # ABI encoding
    └── fragments.js            # ABI fragments
```

### Viem Source Locations

```
node_modules/viem/_esm/
├── clients/
│   ├── createClient.js         # Base client factory
│   ├── createPublicClient.js   # PublicClient
│   ├── createWalletClient.js   # WalletClient
│   └── createTestClient.js     # TestClient
├── accounts/
│   ├── privateKeyToAccount.js  # Private key account
│   ├── mnemonicToAccount.js    # Mnemonic account
│   ├── hdKeyToAccount.js       # HD key account
│   └── toAccount.js            # Account utilities
└── actions/
    ├── public/                 # PublicClient actions
    │   ├── call.js
    │   ├── estimateGas.js
    │   ├── getBalance.js
    │   ├── getBlock.js
    │   ├── getTransaction.js
    │   ├── readContract.js     # <-- Contract reads
    │   └── ...
    └── wallet/                 # WalletClient actions
        ├── sendTransaction.js
        ├── signMessage.js
        ├── writeContract.js    # <-- Contract writes
        └── ...
```

### What to Extract from Source

Read the source and document:

```xml
<extraction_requirements>
  <api_surface>
    - Constructor signature and options
    - All public methods with signatures
    - Return types
    - Event emitters (if any)
  </api_surface>

  <behavior_details>
    - Retry logic (how many retries? backoff strategy?)
    - Gas estimation (automatic? configurable?)
    - Nonce management (auto-increment? manual?)
    - Error handling (error types? wrapping?)
    - Caching (what is cached? TTL?)
    - Batching (request batching? multicall?)
    - Polling (intervals? strategies?)
  </behavior_details>

  <internal_patterns>
    - How does it handle network switching?
    - How does it validate inputs?
    - How does it format outputs?
    - What internal state does it track?
  </internal_patterns>
</extraction_requirements>
```

### Read Commands

For the selected abstraction, READ these files (use Read tool):

**ethers-provider**:
```
node_modules/ethers/lib.esm/providers/abstract-provider.js
node_modules/ethers/lib.esm/providers/provider-jsonrpc.js
node_modules/ethers/lib.esm/providers/network.js
```

**ethers-signer**:
```
node_modules/ethers/lib.esm/providers/abstract-signer.js
node_modules/ethers/lib.esm/wallet/base-wallet.js
```

**ethers-contract**:
```
node_modules/ethers/lib.esm/contract/contract.js
node_modules/ethers/lib.esm/contract/wrappers.js
```

**ethers-hdwallet**:
```
node_modules/ethers/lib.esm/wallet/hdwallet.js
node_modules/ethers/lib.esm/wallet/mnemonic.js
node_modules/ethers/lib.esm/crypto/hdkey.js
```

**ethers-interface**:
```
node_modules/ethers/lib.esm/abi/interface.js
node_modules/ethers/lib.esm/abi/abi-coder.js
node_modules/ethers/lib.esm/abi/fragments.js
```

**viem-publicclient**:
```
node_modules/viem/_esm/clients/createPublicClient.js
node_modules/viem/_esm/clients/createClient.js
node_modules/viem/_esm/actions/public/call.js
node_modules/viem/_esm/actions/public/getBalance.js
node_modules/viem/_esm/actions/public/estimateGas.js
```

**viem-walletclient**:
```
node_modules/viem/_esm/clients/createWalletClient.js
node_modules/viem/_esm/actions/wallet/sendTransaction.js
node_modules/viem/_esm/actions/wallet/signMessage.js
```

**viem-account**:
```
node_modules/viem/_esm/accounts/privateKeyToAccount.js
node_modules/viem/_esm/accounts/mnemonicToAccount.js
node_modules/viem/_esm/accounts/toAccount.js
node_modules/viem/_esm/accounts/types.js
```

**viem-testclient**:
```
node_modules/viem/_esm/clients/createTestClient.js
node_modules/viem/_esm/actions/test/mine.js
node_modules/viem/_esm/actions/test/setBalance.js
```

**viem-contract**:
```
node_modules/viem/_esm/actions/public/readContract.js
node_modules/viem/_esm/actions/wallet/writeContract.js
node_modules/viem/_esm/actions/public/simulateContract.js
node_modules/viem/_esm/actions/public/getContractEvents.js
```

**nonce-manager**:
```
node_modules/ethers/lib.esm/providers/abstract-signer.js
node_modules/ethers/lib.esm/wallet/base-wallet.js
```
Look for: `getNonce`, `populateTransaction`, nonce tracking logic

**multicall**:
```
node_modules/viem/_esm/actions/public/multicall.js
node_modules/viem/_esm/utils/abi/encodeDeployData.js
```
Also read Multicall3 ABI: https://github.com/mds1/multicall

**batched-provider**:
```
node_modules/viem/_esm/utils/promise/createBatchScheduler.js
node_modules/viem/_esm/clients/createClient.js
node_modules/viem/_esm/utils/promise/withResolvers.js
```
Look for: batch config options, how scheduler is used in client

</source_reading>

---

## Phase 2: Document Requirements

After reading source, create a requirements document:

```markdown
# [Abstraction Name] Requirements

## Source Files Read
- [ ] file1.js - [brief notes]
- [ ] file2.js - [brief notes]

## API Surface

### Constructor
```typescript
function create[Name](options: {
  // document all options with types
}): [ReturnType]
```

### Methods
| Method | Signature | Description |
|--------|-----------|-------------|
| method1 | `(arg: Type) => Promise<Result>` | What it does |

## Behavior Requirements

### Retry Logic
- Retries: [number]
- Backoff: [strategy]
- Retryable errors: [list]

### Gas Handling
- Auto-estimation: [yes/no]
- Gas buffer: [percentage]
- Priority fee handling: [details]

### Nonce Management
- Auto-increment: [yes/no]
- Pending nonce tracking: [details]

### Error Handling
- Error types: [list]
- Error wrapping: [strategy]

### Caching
- Cached data: [list]
- TTL: [duration]

### Other Behaviors
- [Any other important behaviors]

## Voltaire Primitives to Use
- Address, Hex, Abi, etc.
```

Save this to: `examples/[abstraction]/REQUIREMENTS.md`

---

## Phase 3: Implementation

<file_structure>
Create these files in `examples/[abstraction]/`:

```
examples/[abstraction]/
├── [Name].js           # Main implementation (JSDoc types)
├── [Name]Type.ts       # TypeScript type definitions
├── errors.ts           # Custom error classes
├── examples.test.ts    # Unit tests
├── basic-usage.ts      # Usage example
└── REQUIREMENTS.md     # Requirements doc from Phase 2
```
</file_structure>

### Implementation Guidelines

<implementation_rules>
1. **Use Voltaire primitives** - Import from `../../src/primitives/` and `../../src/crypto/`
2. **Match API faithfully** - Method names, signatures, and behaviors should match source
3. **JSDoc in .js files** - Types via JSDoc comments, not TypeScript
4. **Separate type file** - Put TypeScript types in [Name]Type.ts
5. **Custom errors** - Create specific error classes in errors.ts
6. **No external deps** - Only Voltaire primitives and built-in modules
</implementation_rules>

### Example Structure (Reference: examples/contract/)

```javascript
/**
 * [Name] Factory - Copyable Implementation
 *
 * This is a reference implementation of [description].
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/[abstraction]/[Name]
 */

import { Address } from "../../src/primitives/Address/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
// ... other imports

/**
 * @typedef {import('./[Name]Type.js').[Name]Instance} [Name]Instance
 * @typedef {import('./[Name]Type.js').[Name]Options} [Name]Options
 */

/**
 * Create a [Name] instance.
 *
 * @param {[Name]Options} options - Configuration
 * @returns {[Name]Instance} [Name] instance
 *
 * @example
 * ```typescript
 * const [name] = [Name]({
 *   // options
 * });
 *
 * // Usage
 * const result = await [name].method();
 * ```
 */
export function [Name](options) {
  // Implementation
}
```

---

## Phase 4: Testing

<testing_requirements>
Create comprehensive tests in `examples/[abstraction]/examples.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { [Name] } from "./[Name].js";

describe("[Name]", () => {
  describe("construction", () => {
    it("creates instance with required options", () => {});
    it("throws on missing required options", () => {});
    it("accepts optional configuration", () => {});
  });

  describe("methods", () => {
    // Test each public method
    describe("[methodName]", () => {
      it("returns expected result", async () => {});
      it("handles errors correctly", async () => {});
      it("validates inputs", async () => {});
    });
  });

  describe("behavior", () => {
    // Test behaviors extracted from source
    it("retries on transient errors", async () => {});
    it("estimates gas automatically", async () => {});
    it("manages nonces correctly", async () => {});
  });

  describe("error handling", () => {
    it("throws [ErrorType] on [condition]", async () => {});
  });

  describe("integration", () => {
    // End-to-end scenarios
    it("completes full workflow", async () => {});
  });
});
```

### Mock Provider Pattern

```typescript
const mockProvider = {
  request: vi.fn(async ({ method, params }) => {
    switch (method) {
      case "eth_chainId":
        return "0x1";
      case "eth_call":
        return "0x...";
      // Handle all methods used
      default:
        throw new Error(`Unmocked method: ${method}`);
    }
  }),
};
```
</testing_requirements>

---

## Phase 5: Documentation

<documentation_requirements>
Create playbook doc in `docs/playbooks/[abstraction].mdx`:

```mdx
---
title: "[Name] Pattern"
description: "[One-line description]"
---

# [Name] Pattern

A copyable [ethers/viem]-style [name] abstraction built on Voltaire primitives.

<Note>
This is a **reference implementation**, not a library export. Copy the code into your project and modify as needed. See [Primitives Philosophy](/concepts/primitives-philosophy) for why.
</Note>

## Why Copy Instead of Import?

| Benefit | Description |
|---------|-------------|
| **AI Context** | LLMs see your full implementation, can modify and debug it |
| **Customizable** | Add methods, change error handling, add caching |
| **No Lock-in** | Modify freely, no library updates to worry about |
| **Right-sized** | Remove what you don't need |

## Quick Start

\`\`\`typescript
import { [Name] } from './[Name].js';  // Your local copy

const [name] = [Name]({
  // options
});

// Usage
const result = await [name].method();
\`\`\`

## Implementation

Copy these files into your project:

<Tabs>
  <Tab title="[Name].js">
\`\`\`javascript
// Full implementation here
\`\`\`
  </Tab>
  <Tab title="[Name]Type.ts">
\`\`\`typescript
// Type definitions here
\`\`\`
  </Tab>
  <Tab title="errors.ts">
\`\`\`typescript
// Error classes here
\`\`\`
  </Tab>
</Tabs>

## API Reference

### Constructor

\`\`\`typescript
function [Name](options: [Name]Options): [Name]Instance
\`\`\`

### Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| prop1 | `Type` | Yes | Description |

### Methods

#### method1

\`\`\`typescript
[name].method1(arg: Type): Promise<Result>
\`\`\`

[Description]

## Customization Ideas

### Add Caching

\`\`\`javascript
// Example customization
\`\`\`

### Add Retry Logic

\`\`\`javascript
// Example customization
\`\`\`

## Related

- [Primitives Philosophy](/concepts/primitives-philosophy)
- [Other relevant links]
```
</documentation_requirements>

---

## Phase 6: Verification

<verification>
### Run Tests
```bash
bun run test:run examples/[abstraction]/
```

All tests MUST pass.

### Type Check
```bash
bun typecheck
```

No type errors allowed.

### Verify Docs Build
```bash
bun run docs:dev
# Navigate to /playbooks/[abstraction] and verify renders
```
</verification>

---

## Phase 7: Final Review

<final_checklist>
Before completing, verify:

- [ ] Source code was read (list files read)
- [ ] Requirements documented in REQUIREMENTS.md
- [ ] Implementation matches source behavior
- [ ] All tests passing
- [ ] Types are correct (no `any`)
- [ ] Playbook documentation created
- [ ] Code follows existing patterns (see examples/contract/)

### Output Summary

```
## [Abstraction Name] Implementation Complete

### Files Created
- examples/[abstraction]/[Name].js
- examples/[abstraction]/[Name]Type.ts
- examples/[abstraction]/errors.ts
- examples/[abstraction]/examples.test.ts
- examples/[abstraction]/basic-usage.ts
- examples/[abstraction]/REQUIREMENTS.md
- docs/playbooks/[abstraction].mdx

### Source Files Read
- [list files]

### Key Behaviors Implemented
- [list behaviors]

### Tests
- X tests passing

### Next Steps
- User should copy files to their project
- Customize as needed
```
</final_checklist>

---

## Abstraction-Specific Notes

<abstraction_notes>
### ethers-provider
- Key file: `abstract-provider.js` (51KB) - read carefully
- Implements: getBalance, getBlock, getTransaction, call, estimateGas, etc.
- Features: polling, caching, event emitter
- Note: ethers Provider is read-only, Signer extends it for writes

### ethers-signer
- Extends Provider functionality
- Key methods: signMessage, signTransaction, sendTransaction
- populateTransaction auto-fills gas, nonce, chainId

### ethers-contract
- We already have `examples/contract/` - enhance or use as viem-style
- Key: typed method generation from ABI
- Features: read, write, events, estimateGas

### ethers-hdwallet
- BIP32/39 implementation
- Key: derivePath, mnemonic handling
- Security: proper memory handling for private keys

### ethers-interface
- ABI encoding/decoding
- We have `src/primitives/Abi/` - this wraps it ethers-style
- Key: encodeFunctionData, decodeFunctionResult, parseLog

### viem-publicclient
- Functional composition pattern
- Actions are separate functions, not methods
- Key: extend() for custom actions

### viem-walletclient
- Requires Account to sign
- sendTransaction, signMessage, etc.
- Note: separation from PublicClient

### viem-account
- privateKeyToAccount, mnemonicToAccount
- signMessage, signTransaction, signTypedData
- Key: LocalAccount type

### viem-testclient
- For local dev/testing (anvil, hardhat)
- Actions: mine, setBalance, impersonateAccount, etc.
- Not for production

### viem-contract
- getContract pattern
- Similar to our existing Contract but viem-style
- Key: read, write, simulate, watchEvent

### nonce-manager
- Tracks pending transaction nonces locally
- Prevents nonce gaps when sending multiple tx quickly
- Key: getNonce, incrementNonce, resetNonce
- ethers implements this in NonceManager class
- Must handle: pending nonce tracking, transaction confirmation, nonce reset on error

### multicall
- Uses Multicall3 contract (deployed on most chains)
- Batches multiple eth_call operations into single call
- Key: allowFailure option, aggregate3 function
- Contract address: 0xcA11bde05977b3631167028862bE2a173976CA11
- Only for reads, not writes

### batched-provider
- JSON-RPC batch requests (different from multicall)
- Debounces concurrent requests, sends as array
- Works with ANY RPC method, not just eth_call
- Key: wait/debounce timing, batch size limits
- Must handle: request deduplication, error propagation, timeout
</abstraction_notes>

---

**Execute now with abstraction: $ARGUMENTS**
