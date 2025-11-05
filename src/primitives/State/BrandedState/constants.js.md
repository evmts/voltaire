# State Constants

## EMPTY_CODE_HASH

Hash of empty EVM bytecode.

- Type: `BrandedHash`
- Length: 32 bytes
- Value: `0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470`

**Formula:** Keccak256("") where "" is empty byte array

**Usage:**
- Identifies accounts with no contract code
- Default codeHash for EOA (Externally Owned Accounts)
- Used in account state validation

```typescript
// Check if account has no code
function isEOA(codeHash: BrandedHash): boolean {
  for (let i = 0; i < 32; i++) {
    if (codeHash[i] !== EMPTY_CODE_HASH[i]) return false;
  }
  return true;
}

// New account
const account = {
  nonce: 0n,
  balance: 0n,
  codeHash: EMPTY_CODE_HASH,
  storageRoot: EMPTY_TRIE_ROOT
};
```

## EMPTY_TRIE_ROOT

Root hash of empty Merkle Patricia Trie.

- Type: `BrandedHash`
- Length: 32 bytes
- Value: `0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421`

**Formula:** Keccak256(RLP(null)) where RLP(null) = 0x80

**Usage:**
- Initial value for account storage roots
- Indicates empty storage trie
- Used when contract has no storage entries

```typescript
// Check if account has storage
function hasStorage(storageRoot: BrandedHash): boolean {
  for (let i = 0; i < 32; i++) {
    if (storageRoot[i] !== EMPTY_TRIE_ROOT[i]) return true;
  }
  return false;
}

// Initialize new contract
const contract = {
  nonce: 1n,
  balance: 0n,
  codeHash: deployedCodeHash,
  storageRoot: EMPTY_TRIE_ROOT // No storage yet
};
```

## Comparison

Both are well-known 32-byte hash constants with distinct values:

| Constant | Purpose | Value Prefix |
|----------|---------|--------------|
| EMPTY_CODE_HASH | No bytecode | 0xc5d246... |
| EMPTY_TRIE_ROOT | Empty storage | 0x56e81f... |

Never equal - serve different purposes in account state.
