# Review: Add WebSocket Reconnection

## Priority: 🔴 CRITICAL

## Summary

The WebSocket transport doesn't reconnect on disconnect, making it unusable for long-running applications.

## Current Problem

When a WebSocket connection drops (network blip, server restart), the transport fails permanently. All pending and future requests fail.

## Implementation

### 1. Add reconnection logic

```typescript
// src/services/Transport/WebSocketTransport.ts
export interface WebSocketTransportOptions {
  /** Auto-reconnect on disconnect */
  reconnect?: boolean | {
    /** Max reconnection attempts */
    maxAttempts?: number;
    /** Initial delay in ms */
    delay?: number;
    /** Max delay in ms */
    maxDelay?: number;
    /** Multiplier for exponential backoff */
    multiplier?: number;
  };
  /** Keep-alive ping interval in ms */
  keepAlive?: number;
}

const createReconnectingWebSocket = (
  url: string,
  options: WebSocketTransportOptions
) => Effect.gen(function* () {
  const reconnectOpts = typeof options.reconnect === 'object'
    ? options.reconnect
    : { maxAttempts: 10, delay: 1000, maxDelay: 30000, multiplier: 2 };
  
  let ws: WebSocket | null = null;
  let attempts = 0;
  let currentDelay = reconnectOpts.delay ?? 1000;
  
  const connect = (): Effect.Effect<WebSocket, TransportError> =>
    Effect.async((resume) => {
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        attempts = 0;
        currentDelay = reconnectOpts.delay ?? 1000;
        ws = socket;
        resume(Effect.succeed(socket));
      };
      
      socket.onclose = () => {
        ws = null;
        if (options.reconnect && attempts < (reconnectOpts.maxAttempts ?? 10)) {
          attempts++;
          setTimeout(() => {
            Effect.runPromise(connect());
          }, currentDelay);
          currentDelay = Math.min(
            currentDelay * (reconnectOpts.multiplier ?? 2),
            reconnectOpts.maxDelay ?? 30000
          );
        }
      };
      
      socket.onerror = (e) => {
        resume(Effect.fail(new TransportError(e, 'WebSocket connection failed')));
      };
    });
  
  return { connect, getSocket: () => ws };
});
```

### 2. Add keep-alive pings

```typescript
const startKeepAlive = (ws: WebSocket, interval: number) => {
  const timer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // Send JSON-RPC compatible ping
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'keepalive',
        method: 'web3_clientVersion',
        params: []
      }));
    }
  }, interval);
  
  return () => clearInterval(timer);
};
```

### 3. Queue requests during reconnection

```typescript
const pendingDuringReconnect: Array<{
  request: JsonRpcRequest;
  deferred: Deferred<unknown, TransportError>;
}> = [];

// In request handler
if (!ws || ws.readyState !== WebSocket.OPEN) {
  // Queue request for when connection is restored
  const deferred = yield* Deferred.make<unknown, TransportError>();
  pendingDuringReconnect.push({ request, deferred });
  return yield* Deferred.await(deferred);
}
```

## Usage

```typescript
const transport = WebSocketTransport('wss://eth.llamarpc.com', {
  reconnect: {
    maxAttempts: 10,
    delay: 1000,
    maxDelay: 30000
  },
  keepAlive: 30000 // 30 second pings
});
```

## Testing

- Test reconnection after disconnect
- Test exponential backoff
- Test max attempts limit
- Test request queuing during reconnect
- Test keep-alive pings
