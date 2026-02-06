/**
 * TypedProvider Example
 *
 * Demonstrates the strongly-typed EIP-1193 provider interface.
 * This is a working example showing type safety at compile time.
 */
import type { EIP1193EventMap, TypedProvider, VoltaireRpcSchema } from "../index.js";
/**
 * Example 1: Creating a mock typed provider
 */
export declare function createMockProvider(): TypedProvider<VoltaireRpcSchema, EIP1193EventMap>;
/**
 * Example 2: Type-safe RPC calls
 */
export declare function exampleTypeSafeRequests(): Promise<void>;
/**
 * Example 3: Event handling
 */
export declare function exampleEventHandling(): TypedProvider<VoltaireRpcSchema, EIP1193EventMap>;
/**
 * Example 4: Error handling
 */
export declare function exampleErrorHandling(): Promise<void>;
/**
 * Example 5: Working with options
 */
export declare function exampleWithOptions(): Promise<void>;
/**
 * Example 6: Compile-time type safety demonstration
 *
 * The following would cause TypeScript compilation errors:
 */
export declare function exampleCompileTimeErrors(): Promise<void>;
//# sourceMappingURL=typed-provider-example.d.ts.map