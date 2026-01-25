# Review: Add EIP-5792 Batch Calls

## Priority: 🔴 CRITICAL

## Summary

Implement EIP-5792 wallet batch call support (`sendCalls`, `getCallsStatus`, `getCapabilities`, `waitForCallsStatus`).

## Context

EIP-5792 enables batching multiple calls atomically through wallet_sendCalls. Supported by:
- Coinbase Smart Wallet
- Many AA wallets
- MetaMask (partial)

## Implementation

### 1. Add to SignerShape

```typescript
// src/services/Signer/SignerService.ts
export type SignerShape = {
  // ... existing methods
  
  /** Get wallet capabilities per chain */
  readonly getCapabilities: (
    account?: AddressType
  ) => Effect.Effect<WalletCapabilities, SignerError>;
  
  /** Send batch of calls atomically */
  readonly sendCalls: (
    params: SendCallsParams
  ) => Effect.Effect<string, SignerError>; // Returns bundle ID
  
  /** Get status and receipts of call bundle */
  readonly getCallsStatus: (
    bundleId: string
  ) => Effect.Effect<CallsStatus, SignerError>;
  
  /** Wait for call bundle to complete */
  readonly waitForCallsStatus: (
    bundleId: string,
    options?: { timeout?: number; pollingInterval?: number }
  ) => Effect.Effect<CallsStatus, SignerError>;
};
```

### 2. Define types

```typescript
export interface SendCallsParams {
  calls: readonly {
    to: AddressType;
    data?: HexType;
    value?: bigint;
  }[];
  capabilities?: {
    paymasterService?: { url: string };
    // Other EIP-5792 capabilities
  };
}

export interface CallsStatus {
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  receipts?: readonly {
    transactionHash: HexType;
    blockNumber: bigint;
    gasUsed: bigint;
    status: 'success' | 'reverted';
    logs: readonly LogType[];
  }[];
}

export interface WalletCapabilities {
  [chainId: string]: {
    atomicBatch?: { supported: boolean };
    paymasterService?: { supported: boolean };
    sessionKeys?: { supported: boolean };
  };
}
```

### 3. Implement in Signer.ts

```typescript
getCapabilities: (account) =>
  transport.request<WalletCapabilities>('wallet_getCapabilities', [
    account ? Address.toHex(account) : undefined
  ]).pipe(
    Effect.mapError((e) => new SignerError(
      { action: 'getCapabilities' },
      `Failed to get capabilities: ${e.message}`,
      { cause: e }
    ))
  ),

sendCalls: (params) =>
  Effect.gen(function* () {
    const formattedCalls = params.calls.map(call => ({
      to: Address.toHex(call.to),
      data: call.data,
      value: call.value ? `0x${call.value.toString(16)}` : undefined
    }));
    
    return yield* transport.request<string>('wallet_sendCalls', [{
      version: '1.0',
      chainId: `0x${chainId.toString(16)}`,
      from: Address.toHex(account.address),
      calls: formattedCalls,
      capabilities: params.capabilities
    }]);
  }).pipe(
    Effect.mapError((e) => new SignerError(
      { action: 'sendCalls', params },
      `Failed to send calls: ${e.message}`,
      { cause: e }
    ))
  ),

getCallsStatus: (bundleId) =>
  transport.request<CallsStatus>('wallet_getCallsStatus', [bundleId]).pipe(
    Effect.mapError((e) => new SignerError(
      { action: 'getCallsStatus', bundleId },
      `Failed to get calls status: ${e.message}`,
      { cause: e }
    ))
  ),

waitForCallsStatus: (bundleId, options) =>
  Effect.gen(function* () {
    const timeout = options?.timeout ?? 60000;
    const interval = options?.pollingInterval ?? 1000;
    
    return yield* Effect.retry(
      getCallsStatus(bundleId).pipe(
        Effect.flatMap((status) =>
          status.status === 'PENDING'
            ? Effect.fail(new SignerError({ bundleId }, 'Still pending'))
            : Effect.succeed(status)
        )
      ),
      Schedule.spaced(interval).pipe(
        Schedule.whileInput((e) => e.message === 'Still pending'),
        Schedule.compose(Schedule.elapsed.pipe(
          Schedule.whileOutput((d) => d < Duration.millis(timeout))
        ))
      )
    );
  })
```

## Testing

- Test with mock wallet supporting EIP-5792
- Test capability detection
- Test bundle status polling
- Test timeout handling
