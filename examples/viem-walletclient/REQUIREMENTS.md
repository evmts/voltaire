# Viem WalletClient Requirements

Extracted from viem source code for Voltaire implementation.

## Core Architecture

### createWalletClient Factory

```javascript
// Creates a wallet client by extending base client with wallet actions
function createWalletClient(parameters) {
  const { key = 'wallet', name = 'Wallet Client', transport } = parameters;
  const client = createClient({
    ...parameters,
    key,
    name,
    transport,
    type: 'walletClient',
  });
  return client.extend(walletActions);
}
```

**Key Patterns:**
- Factory function returns client extended with wallet actions
- Base client provides: `account`, `chain`, `transport`, `request`, `uid`
- `extend` pattern allows adding custom actions

### Client Structure

```typescript
interface WalletClient {
  // Identity
  key: string;           // Default: 'wallet'
  name: string;          // Default: 'Wallet Client'
  type: 'walletClient';
  uid: string;           // Unique identifier

  // Configuration
  account?: Account;     // Optional hoisted account
  chain?: Chain;         // Optional chain configuration
  transport: Transport;  // JSON-RPC transport

  // Core
  request: RequestFn;    // RPC request function
  extend: ExtendFn;      // Extension pattern

  // Wallet Actions (from decorator)
  getAddresses: () => Promise<Address[]>;
  requestAddresses: () => Promise<Address[]>;
  sendTransaction: (args) => Promise<Hash>;
  signMessage: (args) => Promise<Hex>;
  signTransaction: (args) => Promise<Hex>;
  signTypedData: (args) => Promise<Hex>;
  // ... more actions
}
```

## Account Types

### parseAccount Utility

```javascript
function parseAccount(account) {
  if (typeof account === 'string')
    return { address: account, type: 'json-rpc' };
  return account;
}
```

### Account Interface

```typescript
// JSON-RPC account (signing via wallet provider)
interface JsonRpcAccount {
  address: Address;
  type: 'json-rpc';
}

// Local account (signing with private key)
interface LocalAccount {
  address: Address;
  publicKey: Hex;
  source: string;          // e.g., 'privateKey', 'hd'
  type: 'local';
  nonceManager?: NonceManager;

  // Signing methods
  sign: (params: { hash: Hex }) => Promise<Hex>;
  signMessage: (params: { message: SignableMessage }) => Promise<Hex>;
  signTransaction: <T>(tx: T, opts?) => Promise<Hex>;
  signTypedData: (params: TypedData) => Promise<Hex>;
  signAuthorization: (params: AuthReq) => Promise<SignedAuth>;
}
```

## Wallet Actions

### getAddresses

```javascript
async function getAddresses(client) {
  // Local account: return single address
  if (client.account?.type === 'local')
    return [client.account.address];

  // JSON-RPC: call eth_accounts
  const addresses = await client.request({
    method: 'eth_accounts'
  }, { dedupe: true });

  return addresses.map(checksumAddress);
}
```

**RPC Method:** `eth_accounts`

### requestAddresses

```javascript
async function requestAddresses(client) {
  const addresses = await client.request({
    method: 'eth_requestAccounts'
  }, { dedupe: true, retryCount: 0 });

  return addresses.map(checksumAddress);
}
```

**RPC Method:** `eth_requestAccounts` (EIP-1102)

### signMessage

```javascript
async function signMessage(client, { account: account_, message }) {
  if (!account_) throw new AccountNotFoundError();
  const account = parseAccount(account_);

  // Local account: sign locally
  if (account.signMessage)
    return account.signMessage({ message });

  // JSON-RPC: call personal_sign
  const message_ = formatMessage(message);
  return client.request({
    method: 'personal_sign',
    params: [message_, account.address],
  }, { retryCount: 0 });
}
```

**Message Formats:**
- `string` -> `stringToHex(message)`
- `{ raw: Uint8Array }` -> `toHex(message.raw)`
- `{ raw: Hex }` -> `message.raw`

**RPC Method:** `personal_sign` (for JSON-RPC accounts)

### signTypedData

```javascript
async function signTypedData(client, parameters) {
  const { account: account_, domain, message, primaryType } = parameters;
  if (!account_) throw new AccountNotFoundError();
  const account = parseAccount(account_);

  const types = {
    EIP712Domain: getTypesForEIP712Domain({ domain }),
    ...parameters.types,
  };

  validateTypedData({ domain, message, primaryType, types });

  // Local account: sign locally
  if (account.signTypedData)
    return account.signTypedData({ domain, message, primaryType, types });

  // JSON-RPC: call eth_signTypedData_v4
  const typedData = serializeTypedData({ domain, message, primaryType, types });
  return client.request({
    method: 'eth_signTypedData_v4',
    params: [account.address, typedData],
  }, { retryCount: 0 });
}
```

**RPC Method:** `eth_signTypedData_v4`

### signTransaction

```javascript
async function signTransaction(client, parameters) {
  const { account: account_, chain, ...transaction } = parameters;
  if (!account_) throw new AccountNotFoundError();
  const account = parseAccount(account_);

  assertRequest({ account, ...parameters });

  const chainId = await getChainId(client);
  if (chain !== null)
    assertCurrentChain({ currentChainId: chainId, chain });

  // Local account: sign locally
  if (account.signTransaction)
    return account.signTransaction({ ...transaction, chainId }, {
      serializer: client.chain?.serializers?.transaction
    });

  // JSON-RPC: call eth_signTransaction
  const format = chain?.formatters?.transactionRequest?.format || formatTransactionRequest;
  return client.request({
    method: 'eth_signTransaction',
    params: [{
      ...format({ ...transaction, account }, 'signTransaction'),
      chainId: numberToHex(chainId),
      from: account.address,
    }],
  }, { retryCount: 0 });
}
```

**RPC Method:** `eth_signTransaction`

### sendTransaction

```javascript
async function sendTransaction(client, parameters) {
  const { account: account_, chain, ...txParams } = parameters;
  if (!account_) throw new AccountNotFoundError();
  const account = parseAccount(account_);

  try {
    assertRequest(parameters);

    // JSON-RPC account: use eth_sendTransaction
    if (account?.type === 'json-rpc' || account === null) {
      const chainId = await getChainId(client);
      assertCurrentChain({ currentChainId: chainId, chain });

      const request = formatTransactionRequest({ ...txParams, chainId });
      return client.request({
        method: 'eth_sendTransaction',
        params: [request],
      }, { retryCount: 0 });
    }

    // Local account: sign + send raw
    if (account?.type === 'local') {
      const request = await prepareTransactionRequest(client, {
        account,
        chain,
        ...txParams,
      });

      const serializedTransaction = await account.signTransaction(request, {
        serializer: chain?.serializers?.transaction,
      });

      return sendRawTransaction(client, { serializedTransaction });
    }

    throw new AccountTypeNotSupportedError({ type: account?.type });
  } catch (err) {
    throw getTransactionError(err, { ...parameters, account, chain });
  }
}
```

**RPC Methods:**
- JSON-RPC account: `eth_sendTransaction`
- Local account: `eth_sendRawTransaction`

### prepareTransactionRequest

Prepares transaction with:
- `nonce`: from `eth_getTransactionCount` or nonceManager
- `chainId`: from chain config or `eth_chainId`
- `type`: inferred from params or network capabilities
- `gas`: from `eth_estimateGas`
- `fees`: from `eth_gasPrice` or EIP-1559 estimation
- `blobVersionedHashes`: from blobs if provided

## Extend Pattern

```javascript
function extend(base) {
  return (extendFn) => {
    const extended = extendFn(base);
    // Remove base client properties from extended
    for (const key in client) delete extended[key];
    const combined = { ...base, ...extended };
    return Object.assign(combined, { extend: extend(combined) });
  };
}
```

**Usage:**
```javascript
const client = createWalletClient({ ... })
  .extend((base) => ({
    customAction: () => doSomething(base),
  }));
```

## Error Handling

### AccountNotFoundError

Thrown when action requires account but none provided.

```javascript
class AccountNotFoundError extends BaseError {
  constructor({ docsPath }) {
    super('Account not found', { docsPath });
  }
}
```

### AccountTypeNotSupportedError

Thrown when account type doesn't support the action.

```javascript
class AccountTypeNotSupportedError extends BaseError {
  constructor({ type, metaMessages, docsPath }) {
    super(`Account type "${type}" is not supported`, {
      metaMessages,
      docsPath,
    });
  }
}
```

## Transport Pattern

Transport is a factory function that returns:

```typescript
interface Transport {
  config: TransportConfig;
  request: RequestFn;
  value?: TransportValue;
}

// Usage
const { config, request, value } = transport({ chain, pollingInterval });
```

**Common transports:**
- `http(url)` - HTTP JSON-RPC
- `webSocket(url)` - WebSocket JSON-RPC
- `custom(provider)` - EIP-1193 provider (e.g., window.ethereum)

## Chain Configuration

```typescript
interface Chain {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[] } };
  blockExplorers?: { default: { url: string } };
  formatters?: {
    transactionRequest?: { format: FormatFn };
  };
  serializers?: {
    transaction?: SerializerFn;
  };
}
```

## Implementation Notes

1. **Account Hoisting**: Account can be set on client creation, avoiding per-action specification
2. **Chain Assertion**: Validates connected chain matches expected chain before sending
3. **LRU Caching**: Caches wallet namespace support per client UID
4. **Dedupe Requests**: `eth_accounts` and `eth_requestAccounts` deduplicate concurrent calls
5. **Retry Control**: Most actions set `retryCount: 0` to prevent auto-retry on failure
6. **Type Inference**: Transaction type inferred from fields (legacy vs EIP-1559 vs EIP-4844)
