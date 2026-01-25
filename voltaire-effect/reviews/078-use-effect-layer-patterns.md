# Use Idiomatic Effect Layer Patterns

**Priority**: Medium  
**Module**: All services  
**Category**: Effect Idiomatic

## Problem

Services use inconsistent layer patterns and miss Effect's layer composition features:

```typescript
// Current: Manual layer composition in user code
const program = Effect.gen(function* () {
  const signer = yield* SignerService;
  return yield* signer.sendTransaction({ to: recipient, value: 1n });
}).pipe(
  Effect.provide(Signer.Live),
  Effect.provide(LocalAccount(privateKey)),
  Effect.provide(Provider),
  Effect.provide(HttpTransport('https://...'))
);
```

## Issues

1. **Manual composition** - Users must know dependency order
2. **Repeated layers** - Same transport provided multiple times
3. **No preset layers** - No ready-to-use production/test configs
4. **Inconsistent naming** - Mix of `Live`, `Default`, naked exports

## Solution

### 1. Consistent Naming Convention

```typescript
// Each service module exports:
export const MyService = Context.GenericTag<MyService>("MyService");
export const MyServiceLive: Layer.Layer<MyService, never, Dependencies> = ...;
export const MyServiceTest: Layer.Layer<MyService> = ...;

// For services with config:
export const MyServiceLive = (config: MyServiceConfig) => Layer.effect(...);
export const MyServiceDefault = MyServiceLive({ /* defaults */ });
```

### 2. Pre-composed Layer Presets

```typescript
// services/presets/index.ts
import * as Layer from "effect/Layer";

// Full production stack
export const EthereumMainnet = (rpcUrl: string) =>
  Layer.mergeAll(
    Provider,
    MemoryCache({ maxSize: 1000 }),
    DefaultFeeEstimator,
    DefaultNonceManager,
  ).pipe(
    Layer.provide(HttpTransport(rpcUrl)),
  );

// With signer
export const EthereumMainnetSigner = (rpcUrl: string, privateKey: HexType) =>
  Layer.mergeAll(
    Signer.Live,
    EthereumMainnet(rpcUrl),
  ).pipe(
    Layer.provide(LocalAccount(privateKey)),
    Layer.provide(CryptoLive),
  );

// Test preset
export const TestProvider = (responses: Record<string, unknown>) =>
  Layer.mergeAll(
    Provider,
    NoopCache,
    DefaultFeeEstimator,
    DefaultNonceManager,
  ).pipe(
    Layer.provide(TestTransport(responses)),
  );
```

### 3. Layer.provideMerge for Dependencies

```typescript
// Instead of requiring users to provide dependencies separately:

// Before: User must provide TransportService
export const Provider: Layer.Layer<ProviderService, never, TransportService>;

// After: Factory that includes transport
export const ProviderLive = {
  http: (url: string) => Provider.pipe(Layer.provide(HttpTransport(url))),
  ws: (url: string) => Provider.pipe(Layer.provide(WebSocketTransport(url))),
  test: (responses: Record<string, unknown>) => Provider.pipe(Layer.provide(TestTransport(responses))),
};

// Usage
const program = Effect.gen(function* () {
  const provider = yield* ProviderService;
  return yield* provider.getBlockNumber();
}).pipe(
  Effect.provide(ProviderLive.http('https://mainnet.infura.io/v3/KEY')),
);
```

### 4. Layer.fresh for Isolation

```typescript
// When layers should not be shared (e.g., per-request state):
export const IsolatedNonceManager = DefaultNonceManager.pipe(Layer.fresh);

// Each provide creates new nonce state
```

### 5. ManagedRuntime for Long-Running Apps

```typescript
// For servers/CLIs, create managed runtime once:
import * as ManagedRuntime from "effect/ManagedRuntime";

const MainRuntime = ManagedRuntime.make(
  Layer.mergeAll(
    EthereumMainnet('https://...'),
    LoggerLive,
    TelemetryLive,
  ),
);

// Use in handlers
app.get('/balance/:address', async (req, res) => {
  const result = await MainRuntime.runPromise(
    Effect.gen(function* () {
      const provider = yield* ProviderService;
      return yield* provider.getBalance(req.params.address);
    }),
  );
  res.json({ balance: result.toString() });
});

// Cleanup on shutdown
process.on('SIGTERM', () => MainRuntime.dispose());
```

## Layer Dependency Graph

Use `Layer.provide` strategically:

```typescript
// Build dependency graph
const TransportLayer = HttpTransport('https://...');

const ProviderLayer = Provider.pipe(
  Layer.provide(TransportLayer),
);

const SignerLayer = Signer.Live.pipe(
  Layer.provide(ProviderLayer),
  Layer.provide(LocalAccount(privateKey)),
  Layer.provide(CryptoLive),
);

// Final composed layer
const AppLayer = Layer.mergeAll(
  SignerLayer,
  ProviderLayer,  // Shared with SignerLayer
  BlockStreamLayer,
);

// Single provide
const program = myProgram.pipe(Effect.provide(AppLayer));
```

## Benefits

1. **Simpler user code** - One `Effect.provide` call
2. **Correct sharing** - Layers shared where appropriate
3. **Test isolation** - Fresh layers for tests
4. **Resource management** - ManagedRuntime handles cleanup
5. **Discoverability** - Presets show recommended configurations

## References

- [Effect Layers](https://effect.website/docs/guides/context-management/layers)
- [Layer Composition](https://effect.website/docs/guides/context-management/layer-memoization)
- [ManagedRuntime](https://effect-ts.github.io/effect/effect/ManagedRuntime.ts.html)
