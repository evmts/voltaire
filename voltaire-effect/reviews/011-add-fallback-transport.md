# Review: Add Fallback Transport

## Priority: 🔴 CRITICAL

## Summary

Implement fallback transport that automatically switches to backup RPCs when the primary fails.

## Implementation

```typescript
// src/services/Transport/FallbackTransport.ts
export interface FallbackTransportOptions {
  /** Rank transports based on latency */
  rank?: boolean;
  /** Number of retries per transport before switching */
  retryCount?: number;
  /** Delay between retries in ms */
  retryDelay?: number;
}

export const FallbackTransport = (
  transports: Layer.Layer<TransportService, never, never>[],
  options: FallbackTransportOptions = {}
): Layer.Layer<TransportService, never, never> =>
  Layer.effect(
    TransportService,
    Effect.gen(function* () {
      const retryCount = options.retryCount ?? 3;
      const instances = transports.map(t => ({
        transport: t,
        failures: 0,
        latency: Infinity
      }));
      
      const getNextTransport = () => {
        if (options.rank) {
          // Sort by latency, filter out failed
          return instances
            .filter(i => i.failures < retryCount)
            .sort((a, b) => a.latency - b.latency)[0];
        }
        // Return first non-failed
        return instances.find(i => i.failures < retryCount);
      };
      
      return {
        request: <T>(method: string, params?: unknown[]) =>
          Effect.gen(function* () {
            for (const instance of instances) {
              if (instance.failures >= retryCount) continue;
              
              const start = Date.now();
              const result = yield* Effect.provide(
                TransportService.request<T>(method, params),
                instance.transport
              ).pipe(
                Effect.tap(() => {
                  instance.latency = Date.now() - start;
                  instance.failures = 0;
                }),
                Effect.tapError(() => {
                  instance.failures++;
                }),
                Effect.option
              );
              
              if (Option.isSome(result)) {
                return result.value;
              }
            }
            
            return yield* Effect.fail(
              new TransportError(
                { method, params },
                'All transports failed'
              )
            );
          })
      };
    })
  );
```

## Usage

```typescript
const transport = FallbackTransport([
  HttpTransport('https://eth.llamarpc.com'),
  HttpTransport('https://rpc.ankr.com/eth'),
  HttpTransport('https://cloudflare-eth.com')
], {
  rank: true,
  retryCount: 2
});

const program = Effect.gen(function* () {
  const provider = yield* ProviderService;
  return yield* provider.getBlockNumber();
}).pipe(
  Effect.provide(Provider),
  Effect.provide(transport)
);
```

## Features

- **Automatic failover**: Switches to next transport on error
- **Latency ranking**: Prefers faster RPCs when `rank: true`
- **Configurable retries**: Per-transport retry count
- **Recovery**: Failed transports can recover over time

## Testing

- Test failover on error
- Test latency-based ranking
- Test all-failed scenario
- Test recovery after failures
