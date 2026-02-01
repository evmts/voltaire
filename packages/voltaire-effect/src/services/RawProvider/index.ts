/**
 * @fileoverview Raw Provider module exports for voltaire-effect.
 *
 * @module RawProvider
 * @since 0.0.1
 *
 * @description
 * Effect wrappers for voltaire's low-level EIP-1193 provider implementations.
 *
 * ## Direct Access
 *
 * - {@link RawProviderService} - Direct EIP-1193 provider access
 * - {@link RawProviderTransport} - Bridge to RawProviderService
 *
 * ## Native Provider Transports (Bun only)
 *
 * The following transports depend on voltaire's native FFI and require Bun:
 * - `HttpProviderTransport` - HTTP JSON-RPC transport
 * - `WebSocketProviderTransport` - WebSocket transport with subscriptions
 * - `ForkProviderTransport` - Fork mainnet state locally
 * - `InMemoryProviderTransport` - Fully local in-memory provider
 *
 * Import these directly from the individual files when using Bun.
 */

export {
	RawProviderService,
	type RawProviderShape,
	type RequestArguments,
} from "./RawProviderService.js";
export { RawProviderTransport } from "./RawProviderTransport.js";
