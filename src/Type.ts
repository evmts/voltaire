/**
 * Type.from - Factory for creating composable branded types
 *
 * Create branded types with static and instance methods without classes or `this` binding.
 * All methods are tree-shakeable and type-safe.
 *
 * @example
 * ```typescript
 * import { Type } from './Type.js';
 *
 * const Address = Type({
 *   from(value: string | Uint8Array) {
 *     return new Uint8Array(20) as Uint8Array & { __tag: "Address" }
 *   },
 *   staticMethods: {
 *     isAddress(v: unknown) {
 *       return v instanceof Uint8Array && v.length === 20
 *     },
 *   },
 *   instanceMethods: {
 *     toHex(self) {
 *       return "0x" + Buffer.from(self).toString("hex")
 *     },
 *   },
 * })
 *
 * const addr = Address("0x1234")
 * Address.isAddress(addr)   // true
 * addr.toHex()              // "0x..."
 * const { toHex } = addr; toHex() // works safely
 * ```
 */

// Type for a branded value with instance methods attached
type BrandedWithMethods<T, M> = T & M;

// Extract return type from a function (handles generics)
type InferFromReturn<F> = F extends (...args: any[]) => infer R ? R : never;

// Transform instance method signatures to receive branded value as first param
type InstanceMethodsAsStatic<T, Methods> = {
  [K in keyof Methods]: Methods[K] extends (self: any, ...args: infer Args) => infer R
    ? (self: T, ...args: Args) => R
    : never;
};

// Transform instance methods to be callable without explicit self
type InstanceMethodsBound<Methods> = {
  [K in keyof Methods]: Methods[K] extends (self: any, ...args: infer Args) => infer R
    ? (...args: Args) => R
    : never;
};

/**
 * Configuration for Type.from factory
 */
export interface TypeConfig<
  TFrom extends (...args: any[]) => any,
  TStaticMethods extends Record<string, any>,
  TInstanceMethods extends Record<string, (self: any, ...args: any[]) => any>,
> {
  from: TFrom;
  staticMethods?: TStaticMethods;
  instanceMethods?: TInstanceMethods;
}

/**
 * Create a branded type factory with static and instance methods
 *
 * @param config - Configuration with from, staticMethods, and instanceMethods
 * @returns Callable factory with attached static methods and instance method binding
 *
 * @example
 * ```typescript
 * const MyType = Type({
 *   from: (x: string) => x as string & { __brand: "MyType" },
 *   staticMethods: { validate: (v: unknown) => typeof v === "string" },
 *   instanceMethods: { toUpper: (self) => self.toUpperCase() },
 * })
 *
 * const val = MyType("hello")
 * val.toUpper() // "HELLO"
 * MyType.validate("test") // true
 * ```
 */
export function Type<
  TFrom extends (...args: any[]) => any,
  TStaticMethods extends Record<string, any> = {},
  TInstanceMethods extends Record<string, (self: any, ...args: any[]) => any> = {},
>(
  config: TypeConfig<TFrom, TStaticMethods, TInstanceMethods>,
): TFrom &
  TStaticMethods &
  InstanceMethodsAsStatic<InferFromReturn<TFrom>, TInstanceMethods> & {
    instanceMethods: InstanceMethodsAsStatic<InferFromReturn<TFrom>, TInstanceMethods>;
  } {
  type BrandedType = InferFromReturn<TFrom>;

  // Create callable factory
  const factory = ((...args: Parameters<TFrom>) => {
    const value = config.from(...args) as BrandedType;

    // If no instance methods, return raw value
    if (!config.instanceMethods || Object.keys(config.instanceMethods).length === 0) {
      return value as BrandedWithMethods<BrandedType, InstanceMethodsBound<TInstanceMethods>>;
    }

    // For primitives (string, number, bigint), we need to wrap in an object
    // For objects/Uint8Array, we can attach directly
    const isPrimitive =
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "bigint" ||
      typeof value === "boolean";

    let result: any;

    if (isPrimitive) {
      // Create wrapper object that extends the primitive
      result = Object.create(Object.getPrototypeOf(value));
      result.valueOf = () => value;
      result.toString = () => String(value);
      // Copy over any existing properties
      Object.assign(result, value);
    } else {
      result = value;
    }

    // Attach bound instance methods
    for (const key in config.instanceMethods) {
      const method = config.instanceMethods[key];
      // Bind the actual value (not the wrapper) to the method
      result[key] = (...args: any[]) => method(value, ...args);
    }

    return result as BrandedWithMethods<BrandedType, InstanceMethodsBound<TInstanceMethods>>;
  }) as any;

  // Attach static methods
  if (config.staticMethods) {
    for (const key in config.staticMethods) {
      factory[key] = config.staticMethods[key];
    }
  }

  // Attach instance methods as static (callable with explicit self)
  if (config.instanceMethods) {
    for (const key in config.instanceMethods) {
      factory[key] = config.instanceMethods[key];
    }
  }

  // Export instanceMethods object for composition
  factory.instanceMethods = config.instanceMethods || {};

  return factory;
}
