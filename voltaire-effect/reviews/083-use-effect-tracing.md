# Use Effect Tracing for Observability

**Priority**: Low  
**Module**: All services  
**Category**: Effect Idiomatic

## Problem

No built-in tracing or observability for debugging and monitoring:

```typescript
// Current: No visibility into operation flow
const program = Effect.gen(function* () {
  const provider = yield* ProviderService;
  const block = yield* provider.getBlock();
  const balance = yield* provider.getBalance(address);
  return { block, balance };
});
// When this fails, where did it fail? How long did each step take?
```

## Issues

1. **No spans** - Can't see operation timing
2. **No context** - Hard to debug failures
3. **No metrics** - No performance visibility
4. **No correlation** - Can't trace requests across services

## Solution

Use Effect's built-in tracing with `Effect.withSpan`:

```typescript
import * as Effect from "effect/Effect";

// Add spans to service methods
export const Provider: Layer.Layer<ProviderService, never, TransportService> =
  Layer.effect(
    ProviderService,
    Effect.gen(function* () {
      const transport = yield* TransportService;

      return {
        getBlockNumber: () =>
          transport.request<string>("eth_blockNumber").pipe(
            Effect.map((hex) => BigInt(hex)),
            Effect.withSpan("Provider.getBlockNumber"),  // ✅ Add span
          ),

        getBlock: (args?: GetBlockArgs) =>
          Effect.gen(function* () {
            const method = args?.blockHash ? "eth_getBlockByHash" : "eth_getBlockByNumber";
            const params = ...;
            return yield* transport.request<BlockType>(method, params);
          }).pipe(
            Effect.withSpan("Provider.getBlock", {
              attributes: {
                blockTag: args?.blockTag ?? "latest",
                blockHash: args?.blockHash,
                includeTransactions: args?.includeTransactions ?? false,
              },
            }),
          ),

        getBalance: (address, blockTag) =>
          transport.request<string>("eth_getBalance", [address, blockTag]).pipe(
            Effect.map((hex) => BigInt(hex)),
            Effect.withSpan("Provider.getBalance", {
              attributes: { address, blockTag },
            }),
          ),
      };
    }),
  );
```

## Transport Layer Tracing

```typescript
const doFetch = <T>(body: string, headers: Record<string, string>) =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(config.url, { method: "POST", headers, body }),
      catch: toTransportError,
    });
    // ...
  }).pipe(
    Effect.withSpan("HttpTransport.request", {
      attributes: {
        url: config.url,
        method: "POST",
      },
    }),
  );
```

## Span Links for Request Correlation

```typescript
// Link related operations
const sendTransaction = (tx: TransactionRequest) =>
  Effect.gen(function* () {
    const signedTx = yield* signTransaction(tx).pipe(
      Effect.withSpan("Signer.sign"),
    );
    
    const txHash = yield* broadcast(signedTx).pipe(
      Effect.withSpan("Signer.broadcast"),
    );
    
    return txHash;
  }).pipe(
    Effect.withSpan("Signer.sendTransaction", {
      attributes: {
        to: tx.to,
        value: tx.value?.toString(),
      },
    }),
  );
```

## Tracer Configuration

```typescript
import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

// Production tracer
const TracingLive = NodeSdk.layer(() => ({
  resource: {
    serviceName: "voltaire-app",
    serviceVersion: "1.0.0",
  },
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" }),
  ),
}));

// Or console tracer for development
const TracingDev = Layer.succeed(
  Tracer.Tracer,
  Tracer.make({
    span: (name, parent, context, links, startTime, kind) => ({
      name,
      spanId: Tracer.randomSpanId(),
      traceId: parent.pipe(
        Option.map((p) => p.traceId),
        Option.getOrElse(() => Tracer.randomTraceId()),
      ),
      parent,
      context,
      links,
      startTime,
      kind,
      status: { _tag: "Started" },
      end: (endTime, exit) => {
        console.log(`[${name}] ${Duration.format(Duration.subtract(endTime, startTime))}`);
      },
      attribute: (key, value) => {},
      event: (name, startTime, attributes) => {},
    }),
  }),
);
```

## Metrics with Effect

```typescript
import * as Metric from "effect/Metric";

// Define metrics
const requestCounter = Metric.counter("rpc_requests_total", {
  description: "Total RPC requests",
});

const requestDuration = Metric.histogram("rpc_request_duration_seconds", {
  description: "RPC request duration",
  boundaries: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

// Use in transport
const request = <T>(method: string, params: unknown[]) =>
  transport.request<T>(method, params).pipe(
    Metric.trackDuration(requestDuration),
    Effect.tap(() =>
      Metric.increment(requestCounter, {
        method,
        status: "success",
      }),
    ),
    Effect.tapError(() =>
      Metric.increment(requestCounter, {
        method,
        status: "error",
      }),
    ),
  );
```

## Logging with Context

```typescript
import * as Effect from "effect/Effect";

// Structured logging
const getBlock = (args?: GetBlockArgs) =>
  Effect.gen(function* () {
    yield* Effect.logDebug("Fetching block", {
      blockTag: args?.blockTag,
      blockHash: args?.blockHash,
    });
    
    const block = yield* transport.request(...);
    
    yield* Effect.logInfo("Block fetched", {
      blockNumber: block.number,
      transactionCount: block.transactions.length,
    });
    
    return block;
  }).pipe(
    Effect.withSpan("Provider.getBlock"),
  );
```

## Benefits

1. **Visibility** - See operation flow and timing
2. **Debugging** - Trace errors to specific operations
3. **Performance** - Identify slow operations
4. **Correlation** - Link related operations
5. **OpenTelemetry** - Export to any observability platform

## References

- [Effect Tracing](https://effect.website/docs/guides/observability/tracing)
- [Effect Metrics](https://effect.website/docs/guides/observability/metrics)
- [Effect Logging](https://effect.website/docs/guides/observability/logging)
- [@effect/opentelemetry](https://github.com/Effect-TS/effect/tree/main/packages/opentelemetry)
