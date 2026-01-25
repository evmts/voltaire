# Use Idiomatic Effect Layer Patterns

<issue>
<metadata>
<id>078</id>
<priority>P2</priority>
<category>Effect Idiomatic</category>
<module>All services</module>
<files>
  - services/**/*.ts
</files>
</metadata>

<problem>
Services use inconsistent layer patterns and miss Effect's layer composition features:

```typescript
// ❌ Current: Manual layer composition in user code
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

**Issues:**
1. **Manual composition** - Users must know dependency order
2. **Repeated layers** - Same transport provided multiple times
3. **No preset layers** - No ready-to-use production/test configs
4. **Inconsistent naming** - Mix of `Live`, `Default`, naked exports
</problem>

<effect_pattern>
<name>Consistent Layer Naming Convention</name>
<rationale>
Consistent naming makes layers discoverable and predictable:
- `ServiceLive` - Production implementation
- `ServiceTest` - Test implementation with mocks
- `ServiceDefault` - Pre-configured with defaults
- `Service` - The Context Tag
</rationale>
<before>
```typescript
// ❌ Inconsistent naming
export const Provider = Layer.effect(...);      // Is this a tag or layer?
export const Live = Layer.effect(...);          // Live what?
export const DefaultNonceManager = Layer.effect(...);  // Inconsistent
```
</before>
<after>
```typescript
// ✅ Consistent naming
export const ProviderService = Context.GenericTag<ProviderService>("ProviderService");
export const ProviderLive: Layer.Layer<ProviderService, never, TransportService> = ...;
export const ProviderTest: Layer.Layer<ProviderService> = ...;
export const ProviderDefault = ProviderLive; // Alias if no config needed
```
</after>
<effect_docs>https://effect.website/docs/context-management/layers</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Pre-composed Layer Presets</name>
<rationale>
Provide ready-to-use layer compositions for common use cases:
- Reduces boilerplate for users
- Ensures correct layer ordering
- Documents recommended configurations
</rationale>
<before>
```typescript
// ❌ Users must compose manually
const program = myEffect.pipe(
  Effect.provide(Provider),
  Effect.provide(HttpTransport(url)),
  Effect.provide(MemoryCache({ maxSize: 1000 })),
  Effect.provide(DefaultFeeEstimator),
  Effect.provide(DefaultNonceManager),
);
```
</before>
<after>
```typescript
// ✅ Pre-composed presets
// services/presets/index.ts
export const EthereumMainnet = (rpcUrl: string) =>
  Layer.mergeAll(
    ProviderLive,
    MemoryCacheLive({ maxSize: 1000 }),
    FeeEstimatorLive,
    NonceManagerLive,
  ).pipe(
    Layer.provide(HttpTransportLive(rpcUrl)),
  );

// Usage
const program = myEffect.pipe(
  Effect.provide(EthereumMainnet("https://..."))
);
```
</after>
<effect_docs>https://effect.website/docs/context-management/layers#layer-composition</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Layer Factory Functions</name>
<rationale>
For services requiring configuration, export factory functions that return layers:
- Clear signature shows dependencies
- Config is explicit, not hidden
- Easy to provide different configs for different environments
</rationale>
<before>
```typescript
// ❌ Config hidden in layer
export const HttpTransport: Layer.Layer<TransportService> = Layer.effect(
  TransportService,
  Effect.gen(function* () {
    const url = yield* Config.string("HTTP_URL"); // Hidden dep
    // ...
  })
);
```
</before>
<after>
```typescript
// ✅ Explicit config via factory
export const HttpTransportLive = (
  config: HttpTransportConfig | string
): Layer.Layer<TransportService, TransportError> =>
  Layer.effect(
    TransportService,
    Effect.gen(function* () {
      // Config is explicit
    })
  );

// Or with config layer
export const HttpTransportFromConfig: Layer.Layer<
  TransportService,
  ConfigError
> = Layer.effect(
  TransportService,
  Effect.gen(function* () {
    const config = yield* HttpTransportConfig; // Explicit service dep
  })
);
```
</after>
<effect_docs>https://effect.website/docs/context-management/layers#layer-construction</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Layer.fresh for Isolation</name>
<rationale>
Use `Layer.fresh` when each consumer needs its own instance:
- Per-request state (like nonce managers)
- Test isolation
- Avoiding shared state bugs
</rationale>
<before>
```typescript
// ❌ Shared state across consumers
const NonceManager = Layer.effect(NonceManagerService, ...);

// Both get same instance - state leaks!
yield* program1.pipe(Effect.provide(NonceManager));
yield* program2.pipe(Effect.provide(NonceManager));
```
</before>
<after>
```typescript
// ✅ Fresh instance per consumer
const NonceManagerIsolated = NonceManagerLive.pipe(Layer.fresh);

// Each gets its own instance
yield* program1.pipe(Effect.provide(NonceManagerIsolated));
yield* program2.pipe(Effect.provide(NonceManagerIsolated));
```
</after>
<effect_docs>https://effect.website/docs/context-management/layers#layer-memoization</effect_docs>
</effect_pattern>

<effect_pattern>
<name>ManagedRuntime for Applications</name>
<rationale>
For long-running apps, use `ManagedRuntime` to:
- Create runtime once at startup
- Reuse across all handlers
- Proper cleanup on shutdown
</rationale>
<before>
```typescript
// ❌ Creating layers per request
app.get('/balance/:addr', async (req, res) => {
  const result = await Effect.runPromise(
    getBalance(req.params.addr).pipe(
      Effect.provide(Provider),
      Effect.provide(HttpTransport(url)),
    )
  );
  res.json({ balance: result });
});
```
</before>
<after>
```typescript
// ✅ ManagedRuntime for app lifetime
import * as ManagedRuntime from "effect/ManagedRuntime";

const AppRuntime = ManagedRuntime.make(
  Layer.mergeAll(
    EthereumMainnet("https://..."),
    LoggerLive,
  )
);

app.get('/balance/:addr', async (req, res) => {
  const result = await AppRuntime.runPromise(
    getBalance(req.params.addr)
  );
  res.json({ balance: result });
});

// Cleanup on shutdown
process.on('SIGTERM', () => AppRuntime.dispose());
```
</after>
<effect_docs>https://effect.website/docs/runtime#managedruntime</effect_docs>
</effect_pattern>

<solution>
Implement consistent layer patterns across all services:

```typescript
// ============================================
// services/Transport/index.ts
// ============================================

// Tag
export const TransportService = Context.GenericTag<TransportService>(
  "voltaire/TransportService"
);

// Factory layers
export const HttpTransportLive = (
  config: HttpTransportConfig | string
): Layer.Layer<TransportService, TransportError> =>
  Layer.effect(TransportService, makeHttpTransport(config));

export const WebSocketTransportLive = (
  config: WebSocketTransportConfig | string
): Layer.Layer<TransportService, TransportError> =>
  Layer.scoped(TransportService, makeWebSocketTransport(config));

// Test layer
export const TransportTest = (
  responses: Record<string, unknown>
): Layer.Layer<TransportService> =>
  Layer.succeed(TransportService, {
    request: <T>(method: string) =>
      Effect.succeed(responses[method] as T),
  });

// ============================================
// services/Provider/index.ts  
// ============================================

export const ProviderService = Context.GenericTag<ProviderService>(
  "voltaire/ProviderService"
);

// Requires TransportService
export const ProviderLive: Layer.Layer<
  ProviderService,
  never,
  TransportService
> = Layer.effect(ProviderService, makeProvider);

// Pre-composed with HTTP
export const ProviderHttp = (url: string) =>
  ProviderLive.pipe(Layer.provide(HttpTransportLive(url)));

// Pre-composed with WebSocket
export const ProviderWebSocket = (url: string) =>
  ProviderLive.pipe(Layer.provide(WebSocketTransportLive(url)));

// Test layer
export const ProviderTest = (
  responses: Partial<ProviderMockResponses>
): Layer.Layer<ProviderService> =>
  ProviderLive.pipe(Layer.provide(TransportTest(responses)));

// ============================================
// services/presets/index.ts
// ============================================

// Full Ethereum mainnet stack
export const EthereumMainnet = (rpcUrl: string) =>
  Layer.mergeAll(
    ProviderLive,
    MemoryCacheLive({ maxSize: 1000, ttl: Duration.seconds(12) }),
    FeeEstimatorLive,
    NonceManagerLive,
  ).pipe(
    Layer.provide(HttpTransportLive(rpcUrl)),
  );

// With signer
export const EthereumMainnetSigner = (
  rpcUrl: string, 
  privateKey: HexType
) =>
  Layer.mergeAll(
    SignerLive,
    EthereumMainnet(rpcUrl),
  ).pipe(
    Layer.provide(LocalAccountLive(privateKey)),
  );

// WebSocket with subscriptions
export const EthereumWebSocket = (wsUrl: string) =>
  Layer.mergeAll(
    ProviderLive,
    BlockStreamLive,
    SubscriptionLive,
  ).pipe(
    Layer.provide(WebSocketTransportLive(wsUrl)),
  );

// Test preset
export const TestProvider = (
  responses: Record<string, unknown> = {}
) =>
  Layer.mergeAll(
    ProviderLive,
    NoopCacheLive,
    FeeEstimatorLive,
    NonceManagerLive.pipe(Layer.fresh), // Fresh per test
  ).pipe(
    Layer.provide(TransportTest(responses)),
  );

// ============================================
// services/Signer/index.ts
// ============================================

export const SignerService = Context.GenericTag<SignerService>(
  "voltaire/SignerService"
);

// Requires AccountService and ProviderService
export const SignerLive: Layer.Layer<
  SignerService,
  never,
  AccountService | ProviderService
> = Layer.effect(SignerService, makeSigner);

// Convenience: Signer with local account
export const LocalSigner = (privateKey: HexType, rpcUrl: string) =>
  SignerLive.pipe(
    Layer.provide(LocalAccountLive(privateKey)),
    Layer.provide(ProviderHttp(rpcUrl)),
  );

// ============================================
// Usage Examples
// ============================================

// Simple usage with preset
const program = Effect.gen(function* () {
  const provider = yield* ProviderService;
  return yield* provider.getBlockNumber();
}).pipe(
  Effect.provide(EthereumMainnet("https://eth.llamarpc.com")),
);

// With signer
const signedProgram = Effect.gen(function* () {
  const signer = yield* SignerService;
  return yield* signer.sendTransaction({ to: recipient, value: 1n });
}).pipe(
  Effect.provide(EthereumMainnetSigner("https://...", privateKey)),
);

// ManagedRuntime for server
const ServerRuntime = ManagedRuntime.make(
  EthereumMainnet("https://eth.llamarpc.com")
);

app.get('/block', async (req, res) => {
  const block = await ServerRuntime.runPromise(
    Effect.gen(function* () {
      const provider = yield* ProviderService;
      return yield* provider.getBlockNumber();
    })
  );
  res.json({ blockNumber: block.toString() });
});

// Cleanup
process.on('SIGTERM', () => ServerRuntime.dispose());
```
</solution>

<implementation>
<steps>
1. Standardize naming: `XxxService` for tags, `XxxLive/Test/Default` for layers
2. Create factory functions for configurable layers
3. Create `services/presets/` with pre-composed layers
4. Add `Layer.fresh` where isolation needed
5. Document layer dependencies in JSDoc
6. Add ManagedRuntime example to docs
</steps>
<imports>
```typescript
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import * as Effect from "effect/Effect";
import * as ManagedRuntime from "effect/ManagedRuntime";
```
</imports>
</implementation>

<tests>
```typescript
import { Effect, Layer } from "effect";
import { describe, it, expect } from "vitest";

describe("Layer Presets", () => {
  it("EthereumMainnet provides all required services", async () => {
    const program = Effect.gen(function* () {
      yield* ProviderService;
      yield* CacheService;
      yield* FeeEstimatorService;
      yield* NonceManagerService;
      return "ok";
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(EthereumMainnet("https://test.com"))
      )
    );

    expect(result).toBe("ok");
  });

  it("TestProvider provides isolated nonce manager", async () => {
    const increment = Effect.gen(function* () {
      const manager = yield* NonceManagerService;
      return yield* manager.consume("0x1234567890123456789012345678901234567890");
    });

    // Each test gets fresh nonce manager
    const [nonce1, nonce2] = await Effect.runPromise(
      Effect.all([
        increment.pipe(Effect.provide(TestProvider({}))),
        increment.pipe(Effect.provide(TestProvider({}))),
      ])
    );

    // Both start at same nonce (isolated)
    expect(nonce1).toBe(nonce2);
  });

  it("ManagedRuntime can be used across handlers", async () => {
    const runtime = ManagedRuntime.make(
      TestProvider({ eth_blockNumber: "0x100" })
    );

    const block1 = await runtime.runPromise(
      Effect.gen(function* () {
        const provider = yield* ProviderService;
        return yield* provider.getBlockNumber();
      })
    );

    const block2 = await runtime.runPromise(
      Effect.gen(function* () {
        const provider = yield* ProviderService;
        return yield* provider.getBlockNumber();
      })
    );

    expect(block1).toBe(256n);
    expect(block2).toBe(256n);

    await runtime.dispose();
  });
});
```
</tests>

<api>
<before>
```typescript
// ❌ Manual, repeated composition
const program = myEffect.pipe(
  Effect.provide(Signer.Live),
  Effect.provide(LocalAccount(privateKey)),
  Effect.provide(Provider),
  Effect.provide(HttpTransport('https://...'))
);
```
</before>
<after>
```typescript
// ✅ Single preset provides everything
const program = myEffect.pipe(
  Effect.provide(EthereumMainnetSigner("https://...", privateKey))
);

// Or ManagedRuntime for apps
const runtime = ManagedRuntime.make(EthereumMainnet("https://..."));
await runtime.runPromise(myEffect);
```
</after>
</api>

<acceptance_criteria>
- [ ] Consistent naming: XxxService (tag), XxxLive/Test (layers)
- [ ] Factory functions for configurable layers
- [ ] Pre-composed presets in services/presets/
- [ ] Layer.fresh where isolation needed
- [ ] ManagedRuntime example for servers
- [ ] JSDoc documenting layer dependencies
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect Layers](https://effect.website/docs/context-management/layers)
- [Layer Composition](https://effect.website/docs/context-management/layers#layer-composition)
- [Layer Memoization](https://effect.website/docs/context-management/layers#layer-memoization)
- [ManagedRuntime](https://effect.website/docs/runtime#managedruntime)
</references>
</issue>
