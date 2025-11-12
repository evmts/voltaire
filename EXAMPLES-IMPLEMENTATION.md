# Examples Implementation Guide

## What's Been Built

### ✅ Core Infrastructure

1. **Generation Script** (`scripts/generate-example-docs.ts`)
   - Scans examples/ directory for .ts files with snippet markers
   - Extracts code between `// SNIPPET:START` and `// SNIPPET:END`
   - Transforms relative imports to package imports (`@tevm/voltaire/*`)
   - Generates MDX files with frontmatter in docs/examples/
   - Creates navigation manifest for mint.json
   - **Makes examples searchable in docs and MCP server**

2. **Validation Script** (`scripts/validate-examples.ts`)
   - Runs all example scripts as executable tests
   - Reports pass/fail with exit codes
   - Shows execution time for each example
   - Provides detailed error messages

3. **Package Scripts** (added to package.json)
   ```json
   "examples:generate": "bun run scripts/generate-example-docs.ts",
   "examples:test": "bun run scripts/validate-examples.ts",
   "examples:ci": "bun run examples:test && bun run examples:generate"
   ```

4. **Directory Structure**
   ```
   examples/
   ├── getting-started/
   ├── addresses/
   ├── hex-and-bytes/
   ├── hashing/
   ├── signing/
   ├── transactions/
   ├── rlp/
   ├── abi/
   ├── smart-contracts/
   ├── wallets/
   ├── advanced-crypto/
   └── evm/
   ```

5. **Working Examples** (2 complete, tested, documented)
   - `examples/getting-started/hello-voltaire.ts`
   - `examples/addresses/validate-address.ts`

### ✅ Example Pattern

Each example follows this structure:

```typescript
// @title Display Title
// @description Brief description for SEO and navigation

// SNIPPET:START
import { Module } from '../../src/category/Module/index.js';

// Example code that will appear in docs
// Uses relative imports for local execution
// Script is fully executable and demonstrates the concept
const result = Module.doSomething();
console.log(result);
// SNIPPET:END

// Test assertions - these run but aren't shown in docs
import { strict as assert } from 'node:assert';

assert.equal(result, expectedValue);

console.log('✅ All assertions passed');
process.exit(0);
```

**Key Points:**
- Relative imports inside snippet (transformed to package imports in docs)
- Code between markers is extracted and shown in documentation
- Assertions below markers validate the example works
- Must exit 0 on success, non-zero on failure
- @title and @description metadata at top of file

### ✅ Documentation Integration

**How Examples Become Searchable:**

1. **Generate MDX Docs**
   ```bash
   bun run examples:generate
   ```
   Creates `docs/examples/category/example-name.mdx` for each example

2. **Add to Sidebar** (Manual Step)
   Edit `docs/mint.json` navigation:
   ```json
   {
     "group": "Examples",
     "pages": [
       {
         "group": "Getting Started",
         "pages": [
           "examples/getting-started/hello-voltaire",
           "examples/getting-started/address-basics"
         ]
       }
     ]
   }
   ```

3. **MCP Server Indexing**
   - Mintlify docs are indexed by MCP server
   - Users can search: "how to hash with keccak256"
   - MCP returns: `docs/examples/hashing/keccak256-string.mdx`
   - Example is discoverable and searchable

**Benefits:**
- ✅ Examples appear in docs search
- ✅ MCP server finds examples via natural language queries
- ✅ Always accurate (generated from tested code)
- ✅ Single source of truth
- ✅ Can't go out of sync

## What Needs to Be Done

### 📋 Remaining Examples (48+ to create)

#### Getting Started (4 more)
- [ ] `address-basics.ts` - Create and work with addresses
- [ ] `hex-encoding.ts` - Basic hex encoding/decoding
- [ ] `simple-hash.ts` - Hash a transaction
- [ ] `create-signature.ts` - Sign a message

#### Addresses (5 more)
- [ ] `checksum-address.ts` - EIP-55 checksum encoding
- [ ] `create-address.ts` - Contract address from CREATE
- [ ] `compare-addresses.ts` - Compare and sort addresses
- [ ] `address-from-public-key.ts` - Derive address from public key
- [ ] `contract-address-create2.ts` - Deterministic address with CREATE2

#### Hex & Bytes (5)
- [ ] `hex-encode-decode.ts` - Convert between hex and bytes
- [ ] `concatenate-hex.ts` - Combine hex strings
- [ ] `slice-hex.ts` - Extract portions of hex data
- [ ] `hex-to-number.ts` - Convert hex to numbers
- [ ] `pad-hex.ts` - Pad hex strings

#### Hashing (7 more)
- [ ] `keccak256-string.ts` - Hash strings
- [ ] `keccak256-bytes.ts` - Hash byte arrays
- [ ] `sha256-hash.ts` - SHA-256 hashing
- [ ] `ripemd160-hash.ts` - RIPEMD-160 hashing
- [ ] `blake2-hash.ts` - Blake2 hashing
- [ ] `hash-typed-data-eip712.ts` - EIP-712 typed data hashing
- [ ] `hash-transaction.ts` - Transaction hashing

#### Signing & Verification (9 more)
- [ ] `sign-message-secp256k1.ts` - Sign with secp256k1
- [ ] `verify-signature.ts` - Verify ECDSA signature
- [ ] `recover-address.ts` - Recover signer address
- [ ] `sign-transaction.ts` - Sign a transaction
- [ ] `eip712-typed-data-sign.ts` - Sign typed data
- [ ] `bls12-381-sign.ts` - BLS signature
- [ ] `bls12-381-aggregate.ts` - Aggregate BLS signatures
- [ ] `ed25519-sign.ts` - Ed25519 signing
- [ ] `personal-sign.ts` - Personal message signing

#### Transactions (9 more)
- [ ] `create-legacy-tx.ts` - Legacy transaction
- [ ] `create-eip1559-tx.ts` - EIP-1559 transaction
- [ ] `create-eip2930-tx.ts` - EIP-2930 access list
- [ ] `create-eip4844-blob-tx.ts` - EIP-4844 blob transaction
- [ ] `create-eip7702-auth-tx.ts` - EIP-7702 authorization
- [ ] `sign-transaction.ts` - Sign any transaction type
- [ ] `serialize-tx.ts` - Serialize transaction
- [ ] `deserialize-tx.ts` - Deserialize transaction
- [ ] `calculate-tx-hash.ts` - Transaction hash

#### RLP Encoding (4)
- [ ] `encode-rlp-string.ts` - Encode string
- [ ] `encode-rlp-list.ts` - Encode list
- [ ] `decode-rlp.ts` - Decode RLP data
- [ ] `encode-transaction-rlp.ts` - Encode transaction

#### ABI (6)
- [ ] `encode-function-call.ts` - Encode function call data
- [ ] `decode-function-result.ts` - Decode return data
- [ ] `encode-constructor.ts` - Encode constructor args
- [ ] `decode-event-log.ts` - Decode event logs
- [ ] `encode-packed.ts` - Packed encoding
- [ ] `abi-signature.ts` - Function signatures

#### Smart Contracts (5)
- [ ] `deploy-contract.ts` - Deploy contract transaction
- [ ] `call-contract.ts` - Call contract function
- [ ] `parse-logs.ts` - Parse event logs
- [ ] `create-filter.ts` - Create log filter
- [ ] `encode-multicall.ts` - Batch calls

#### Wallets & Keys (5)
- [ ] `generate-mnemonic-bip39.ts` - Generate mnemonic
- [ ] `mnemonic-to-seed.ts` - Mnemonic to seed
- [ ] `derive-hd-wallet.ts` - HD wallet derivation
- [ ] `export-private-key.ts` - Export key
- [ ] `sign-in-with-ethereum-siwe.ts` - SIWE authentication

#### Advanced Crypto (5)
- [ ] `bn254-pairing.ts` - BN254 pairing check
- [ ] `kzg-commitment.ts` - KZG commitment
- [ ] `point-evaluation-eip4844.ts` - EIP-4844 point evaluation
- [ ] `poseidon-hash.ts` - Poseidon hash
- [ ] `aes-gcm-encrypt.ts` - AES-GCM encryption

#### EVM Operations (3)
- [ ] `decode-bytecode.ts` - Analyze bytecode
- [ ] `calculate-gas.ts` - Gas estimation
- [ ] `bloom-filter-check.ts` - Log filtering

## Next Steps

### 1. Create Examples in Batches

Work through categories systematically:

```bash
# Create examples
vim examples/getting-started/address-basics.ts
vim examples/getting-started/hex-encoding.ts
# ... etc

# Test as you go
bun run examples:test

# Generate docs
bun run examples:generate
```

### 2. Testing & Documentation Workflow

```bash
# Run single example
bun run examples/getting-started/hello-voltaire.ts

# Test all examples
bun run examples:test

# Generate MDX from examples
bun run examples:generate

# Verify docs locally
bun run docs:dev
# Visit http://localhost:3000/examples/getting-started/hello-voltaire
```

### 3. Add Examples to mint.json (CRITICAL for MCP)

**This step makes examples searchable via MCP!**

After generating examples, add them to sidebar:

```bash
# Check generated navigation manifest
cat docs/examples-navigation.json
```

**Manually add to `docs/mint.json`** navigation array:

```json
{
  "group": "Examples",
  "pages": [
    {
      "group": "Getting Started",
      "pages": [
        "examples/getting-started/hello-voltaire",
        "examples/getting-started/address-basics"
      ]
    },
    {
      "group": "Addresses",
      "pages": [
        "examples/addresses/validate-address",
        "examples/addresses/checksum-address"
      ]
    }
  ]
}
```

**Why this matters:**
- ✅ Examples appear in Mintlify docs search
- ✅ MCP server indexes these pages
- ✅ Users can find via natural language ("how to validate address")
- ✅ Makes Voltaire discoverable and useful

### 4. Add to CI

Add to your CI pipeline (GitHub Actions, etc.):

```yaml
- name: Validate Examples
  run: bun run examples:ci
```

This ensures:
1. All examples execute successfully
2. Documentation is up to date
3. Examples don't break with code changes

## Tips for Creating Examples

### Finding API Methods

```bash
# Find exports
grep "export" src/primitives/Address/index.ts

# Check method names
ls src/primitives/Address/BrandedAddress/

# Read tests for usage
cat src/primitives/Address/BrandedAddress/*.test.ts
```

### Common Patterns

**Address:**
- `Address.from(value)` - Universal constructor
- `Address.fromHex(hex)` - From hex string
- `Address.isValid(str)` - Validation
- `Address.toHex(addr)` - To hex string

**Hex:**
- `Hex.from(value)` - Create hex
- `Hex.fromBytes(bytes)` - From Uint8Array
- `Hex.toBytes(hex)` - To Uint8Array
- `Hex.concat([hex1, hex2])` - Concatenate

**Keccak256:**
- `Keccak256.hashString(str)` - Hash string
- `Keccak256.hash(bytes)` - Hash bytes
- `Keccak256.hashHex(hex)` - Hash hex

**Transaction:**
- `Transaction.fromEip1559(params)` - Create EIP-1559
- `Transaction.serialize(tx)` - Serialize
- `Transaction.hash(tx)` - Calculate hash

### Testing Your Example

1. **Run it**: `bun run examples/category/name.ts`
2. **Check output**: Should print expected values
3. **Verify assertions**: Should print "✅ All assertions passed"
4. **Exit code**: Should be 0 (success)

### Common Pitfalls

1. **Import paths**: Use `../../src/` not `@tevm/voltaire` (transformed automatically)
2. **Assertions**: Put them AFTER `// SNIPPET:END`
3. **Exit code**: Always `process.exit(0)` on success
4. **Metadata**: Don't forget `// @title` and `// @description`
5. **Real data**: Use actual hashes, addresses (not placeholders)

## Verification

Check your work:

```bash
# Count examples with snippet markers
find examples -name "*.ts" -exec grep -l "SNIPPET:START" {} \; | wc -l

# Run all tests
bun run examples:test

# Generate all docs
bun run examples:generate

# Check generated docs
ls -R docs/examples/
```

## Benefits

Once complete, you'll have:
- ✅ 50+ tested, executable examples
- ✅ Auto-generated, always-accurate documentation
- ✅ Examples that can't go out of sync with code
- ✅ Excellent MCP server search results
- ✅ CI-validated examples
- ✅ Easy to maintain (single source of truth)

## Questions?

- Script not working? Check error messages
- API not found? Check src/ structure
- Test failing? Add better assertions
- Need inspiration? Check existing examples/ directory
