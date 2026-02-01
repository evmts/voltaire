/**
 * Global brand symbol for type branding
 *
 * All branded types in Voltaire use this shared unique symbol to create
 * nominal types that are structurally identical but type-incompatible.
 *
 * This provides zero-runtime overhead type safety, as the brand only exists
 * in TypeScript's type system and is erased during compilation.
 */
export const brand = Symbol.for("voltaire.brand");
