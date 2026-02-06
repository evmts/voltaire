# NonceManager Requirements

Requirements extracted from ethers v6 (`signer-noncemanager.js`) and viem (`utils/nonceManager.ts`).

## Core Problem

When sending multiple Ethereum transactions:
1. Each tx needs a unique sequential nonce
2. Concurrent tx submissions can cause nonce collisions
3. Failed txs can leave nonce gaps
4. Chain state can change between prepare and send

## Key Requirements

### 1. Nonce Tracking Per Address

**ethers approach:**
- Stores `#noncePromise` (cached chain fetch)
- Stores `#delta` (local increment count)
- Final nonce = `await #noncePromise + #delta`

**viem approach:**
- `deltaMap`: per-address increment deltas
- `nonceMap`: LRU cache of previous nonces
- `promiseMap`: cached pending chain fetches

**Our implementation:**
- `deltaMap<string, number>`: local increment count
- `nonceMap<string, number>`: LRU cache (8192 entries)
- `promiseMap<string, Promise<number>>`: shared fetch promises

### 2. Concurrent Transaction Handling

**Critical insight from both libs:**
> Increment delta BEFORE awaiting chain nonce

```js
// ethers NonceManager.sendTransaction()
async sendTransaction(tx) {
    const noncePromise = this.getNonce("pending");
    this.increment();  // <-- increment BEFORE await
    tx.nonce = await noncePromise;
    return this.signer.sendTransaction(tx);
}
```

```js
// viem createNonceManager().consume()
async consume({ address, chainId, client }) {
    const promise = this.get({ address, chainId, client });
    this.increment({ address, chainId });  // <-- increment BEFORE await
    const nonce = await promise;
    return nonce;
}
```

This allows concurrent callers to get unique nonces without blocking.

### 3. Nonce Gap Prevention

**Promise caching (viem):**
```js
let promise = promiseMap.get(key);
if (!promise) {
    promise = (async () => {
        const nonce = await source.get(params);
        // ...handle reorgs...
    })();
    promiseMap.set(key, promise);
}
```

Multiple concurrent `get()` calls share the same chain fetch promise.

### 4. Reset/Sync with Chain

**ethers:**
```js
reset() {
    this.#delta = 0;
    this.#noncePromise = null;
}
```

**viem:**
```js
reset({ address, chainId }) {
    const key = getKey({ address, chainId });
    deltaMap.delete(key);
    promiseMap.delete(key);
}
```

Auto-reset happens in viem after promise resolves (in `finally` block).

### 5. Pending Transaction Awareness

**viem uses 'pending' blockTag:**
```js
async get(parameters) {
    return getTransactionCount(client, {
        address,
        blockTag: 'pending',  // <-- includes mempool txs
    });
}
```

This includes transactions in the mempool, not just confirmed.

### 6. Reorg/Race Condition Handling

**viem tracks previous nonce:**
```js
const previousNonce = nonceMap.get(key) ?? 0;
if (previousNonce > 0 && nonce <= previousNonce) {
    // Chain returned stale nonce (reorg or race)
    return previousNonce + 1;
}
```

If chain nonce goes backwards (reorg), use remembered nonce + 1.

## API Design

### ethers-style (Signer wrapper)

```js
class NonceManager extends AbstractSigner {
    signer;
    #noncePromise;
    #delta;

    getNonce(blockTag);    // Override to add delta
    increment();           // Manual increment
    reset();              // Clear state
    sendTransaction(tx);  // Auto-managed nonce
}
```

Pros: Integrates seamlessly with signer
Cons: Tightly coupled to signer interface

### viem-style (Standalone manager)

```js
const manager = createNonceManager({ source: jsonRpc() });

manager.consume({ address, chainId, client });  // Get + increment
manager.get({ address, chainId, client });      // Get only
manager.increment({ address, chainId });        // Increment only
manager.reset({ address, chainId });            // Clear state
```

Pros: Decoupled, testable, pluggable sources
Cons: Requires manual integration

## Our Implementation

We implement both patterns:

1. **Standalone manager** (viem-style):
   ```js
   const manager = createNonceManager({ source: jsonRpc() });
   const nonce = await manager.consume({ address, chainId, provider });
   ```

2. **Signer wrapper** (ethers-style):
   ```js
   const managed = wrapSigner(wallet, { chainId: 1 });
   await managed.sendTransaction({ to, value });
   ```

3. **Extensions:**
   - `recycle()`: Decrement delta after tx failure
   - `getDelta()`: Get current pending tx count
   - `inMemory()` source: For testing

## Edge Cases

1. **Transaction failure before broadcast:**
   - Must recycle nonce (decrement delta)
   - Otherwise creates nonce gap

2. **Transaction stuck in mempool:**
   - 'pending' blockTag includes it
   - Delta should account for it

3. **Multiple chains:**
   - Key includes chainId: `${address}.${chainId}`
   - Prevents cross-chain nonce confusion

4. **Reorgs:**
   - If chain nonce < previous, use previous + 1
   - Prevents using already-used nonce

5. **Provider failures:**
   - Reset state and refetch
   - Don't assume stale cache is valid
