# Use Effect Config for Configuration

**Priority**: Medium  
**Module**: All transports and services  
**Category**: Effect Idiomatic
**Updated**: 2026-01-26  
**Status**: Not adopted yet (configs remain plain objects)

## Problem

Configuration is handled via plain TypeScript interfaces and manual parsing:

```typescript
// Current: Plain object config
interface HttpTransportConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

## Current Status (2026-01-26)

- Transports (Http/WebSocket/Fallback) still accept plain config objects.
- No usage of `effect/Config` or `ConfigProvider` found in `voltaire-effect/src`.
- Configuration defaults are applied manually inside constructors (e.g., `HttpTransport`).

**Where this is most useful now**:
1. `HttpTransport` / `WebSocketTransport` / `FallbackTransport` option parsing.
2. Provider/Signer presets in `voltaire-effect/src/services/presets/index.ts`.
3. Optional transport `batch` configuration (move to config schema with validation).

export const HttpTransport = (
  options: HttpTransportConfig | string,
): Layer.Layer<TransportService> => {
  const config =
    typeof options === "string"
      ? { url: options, timeout: 30000, retries: 3, retryDelay: 1000 }
      : { ... };
  // ...
};
```

## Issues

1. **No environment support** - Can't read from env vars
2. **No validation** - Invalid configs pass silently
3. **Hardcoded defaults** - Defaults scattered in code
4. **No secret handling** - API keys treated as strings
5. **No redaction** - Secrets logged accidentally

## Solution

Use `@effect/platform` Config for type-safe configuration:

```typescript
import * as Config from "effect/Config";
import * as ConfigError from "effect/ConfigError";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Secret from "effect/Secret";
import * as Duration from "effect/Duration";

// Define config schema
const HttpTransportConfig = Config.all({
  url: Config.string("url").pipe(
    Config.validate({
      message: "URL must start with http:// or https://",
      validation: (s) => s.startsWith("http://") || s.startsWith("https://"),
    }),
  ),
  timeout: Config.duration("timeout").pipe(
    Config.withDefault(Duration.seconds(30)),
  ),
  retries: Config.integer("retries").pipe(
    Config.withDefault(3),
  ),
  retryDelay: Config.duration("retryDelay").pipe(
    Config.withDefault(Duration.seconds(1)),
  ),
  headers: Config.hashMap(Config.string()).pipe(
    Config.nested("headers"),
    Config.withDefault(HashMap.empty()),
  ),
  apiKey: Config.secret("apiKey").pipe(
    Config.option,
  ),
}).pipe(Config.nested("http"));

type HttpTransportConfigType = Config.Config.Success<typeof HttpTransportConfig>;

// Layer that reads config
export const HttpTransportFromConfig: Layer.Layer<
  TransportService,
  ConfigError.ConfigError
> = Layer.effect(
  TransportService,
  Effect.gen(function* () {
    const config = yield* HttpTransportConfig;
    
    // Secret is redacted in logs
    const headers = config.apiKey.pipe(
      Option.map((secret) => ({
        ...HashMap.toEntries(config.headers),
        "Authorization": `Bearer ${Secret.value(secret)}`,
      })),
      Option.getOrElse(() => HashMap.toEntries(config.headers)),
    );

    return makeHttpTransport({
      url: config.url,
      timeout: Duration.toMillis(config.timeout),
      retries: config.retries,
      retryDelay: Duration.toMillis(config.retryDelay),
      headers: Object.fromEntries(headers),
    });
  }),
);
```

## Environment Variable Support

```typescript
// Read from environment
// HTTP_URL, HTTP_TIMEOUT, HTTP_RETRIES, etc.
const program = myProgram.pipe(
  Effect.provide(HttpTransportFromConfig),
  Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())),
);

// Or from specific prefix
const configProvider = ConfigProvider.fromEnv().pipe(
  ConfigProvider.nested("VOLTAIRE"),
);
// Reads: VOLTAIRE_HTTP_URL, VOLTAIRE_HTTP_TIMEOUT, etc.
```

## Config with Defaults and Overrides

```typescript
// Default config
const defaultConfig: HttpTransportConfigType = {
  url: "https://localhost:8545",
  timeout: Duration.seconds(30),
  retries: 3,
  retryDelay: Duration.seconds(1),
  headers: HashMap.empty(),
  apiKey: Option.none(),
};

// Override from env
const configProvider = ConfigProvider.fromEnv().pipe(
  ConfigProvider.orElse(() =>
    ConfigProvider.fromJson(defaultConfig),
  ),
);
```

## Secret Handling

```typescript
import * as Secret from "effect/Secret";
import * as Redacted from "effect/Redacted";

// Config with secrets
const WalletConfig = Config.all({
  privateKey: Config.secret("privateKey"),
  mnemonic: Config.secret("mnemonic").pipe(Config.option),
});

// Use secrets safely
const program = Effect.gen(function* () {
  const config = yield* WalletConfig;
  
  // Secret.value() unwraps - do this only when needed
  const pk = Secret.value(config.privateKey);
  
  // Logging a Secret shows [REDACTED]
  yield* Effect.log("Using wallet", config.privateKey);
  // Output: Using wallet [REDACTED]
});
```

## Presets with Config

```typescript
// Preset configs for common chains
const MainnetConfig = Config.all({
  rpcUrl: Config.string("rpcUrl").pipe(
    Config.withDefault("https://eth.llamarpc.com"),
  ),
  chainId: Config.integer("chainId").pipe(
    Config.withDefault(1),
  ),
}).pipe(Config.nested("mainnet"));

const SepoliaConfig = Config.all({
  rpcUrl: Config.string("rpcUrl").pipe(
    Config.withDefault("https://rpc.sepolia.org"),
  ),
  chainId: Config.integer("chainId").pipe(
    Config.withDefault(11155111),
  ),
}).pipe(Config.nested("sepolia"));

// Chain config union
const ChainConfig = Config.string("network").pipe(
  Config.flatMap((network) => {
    switch (network) {
      case "mainnet": return MainnetConfig;
      case "sepolia": return SepoliaConfig;
      default: return Config.fail(`Unknown network: ${network}`);
    }
  }),
);
```

## Testing with Config

```typescript
import * as ConfigProvider from "effect/ConfigProvider";

describe("HttpTransport", () => {
  it("should use config", async () => {
    const testConfig = ConfigProvider.fromMap(
      new Map([
        ["http.url", "http://localhost:8545"],
        ["http.timeout", "5s"],
      ]),
    );

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(Layer.setConfigProvider(testConfig)),
      ),
    );
  });
});
```

## Benefits

1. **Environment support** - Read from env vars, files, etc.
2. **Validation** - Type-safe with custom validators
3. **Secrets** - Automatic redaction in logs
4. **Composable** - Nest, merge, transform configs
5. **Testable** - Provide mock config for tests
6. **Documentation** - Config schema documents options

## References

- [Effect Config](https://effect.website/docs/guides/configuration)
- [Effect Secret](https://effect-ts.github.io/effect/effect/Secret.ts.html)
- [ConfigProvider](https://effect-ts.github.io/effect/effect/ConfigProvider.ts.html)
