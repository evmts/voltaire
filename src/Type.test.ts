import { describe, it, expect } from "bun:test";
import { Type } from "./Type.js";

describe("Type.from", () => {
  describe("basic functionality", () => {
    const Address = Type({
      from(value: string) {
        return new Uint8Array(20) as Uint8Array & { __tag: "Address" };
      },
      staticMethods: {
        isAddress(v: unknown) {
          return v instanceof Uint8Array && v.length === 20;
        },
      },
      instanceMethods: {
        toHex(self) {
          return "0x" + Buffer.from(self).toString("hex");
        },
      },
    });

    it("creates branded instances", () => {
      const addr = Address("0x1234");
      expect(Address.isAddress(addr)).toBe(true);
    });

    it("binds instance methods correctly", () => {
      const addr = Address("0x1234");
      const { toHex } = addr;
      expect(() => toHex()).not.toThrow();
    });

    it("composes static and instance methods", () => {
      expect(typeof Address.isAddress).toBe("function");
      expect(typeof Address("0x1234").toHex).toBe("function");
    });

    it("exposes instance methods as static with explicit self", () => {
      const addr = Address("0x1234");
      const hex = Address.toHex(addr);
      expect(hex).toMatch(/^0x/);
    });

    it("exposes instanceMethods object for composition", () => {
      expect(Address.instanceMethods).toBeDefined();
      expect(typeof Address.instanceMethods.toHex).toBe("function");
    });
  });

  describe("generic from function", () => {
    it("preserves generics when from accepts generic parameter", () => {
      const Hex = Type({
        from<T extends string | Uint8Array>(value: T): string & { __brand: "Hex" } {
          if (typeof value === "string") {
            return value as string & { __brand: "Hex" };
          }
          return ("0x" + Buffer.from(value).toString("hex")) as string & { __brand: "Hex" };
        },
        staticMethods: {
          isHex(v: unknown): v is string & { __brand: "Hex" } {
            const val = (v as any)?.valueOf?.() ?? v;
            return typeof val === "string" && val.startsWith("0x");
          },
        },
        instanceMethods: {
          toBytes(self): Uint8Array {
            return Buffer.from(self.slice(2), "hex");
          },
        },
      });

      const hex1 = Hex("0xabcd");
      const hex2 = Hex(new Uint8Array([0xab, 0xcd]));

      expect(Hex.isHex(hex1)).toBe(true);
      expect(Hex.isHex(hex2)).toBe(true);
      expect(hex1.toBytes()).toBeInstanceOf(Uint8Array);
    });

    it("handles generic from with multiple type parameters", () => {
      type Sized<N extends number> = Uint8Array & { __size: N };

      const SizedArray = Type({
        from<N extends number>(size: N, fill: number = 0): Sized<N> {
          const arr = new Uint8Array(size).fill(fill);
          return arr as Sized<N>;
        },
        staticMethods: {
          isSized<N extends number>(v: unknown, size: N): v is Sized<N> {
            return v instanceof Uint8Array && v.length === size;
          },
        },
        instanceMethods: {
          size(self): number {
            return self.length;
          },
        },
      });

      const arr5 = SizedArray(5);
      const arr10 = SizedArray(10, 0xff);

      expect(SizedArray.isSized(arr5, 5)).toBe(true);
      expect(arr5.size()).toBe(5);
      expect(arr10.size()).toBe(10);
      expect(arr10[0]).toBe(0xff);
    });

    it("preserves generic inference through instance methods", () => {
      type Container<T> = { value: T; __brand: "Container" };

      const Container = Type({
        from<T>(value: T): Container<T> {
          return { value, __brand: "Container" } as Container<T>;
        },
        staticMethods: {
          isContainer(v: unknown): v is Container<unknown> {
            return (
              typeof v === "object" &&
              v !== null &&
              "__brand" in v &&
              v.__brand === "Container" &&
              "value" in v
            );
          },
        },
        instanceMethods: {
          get<T>(self: Container<T>): T {
            return self.value;
          },
          map<T, U>(self: Container<T>, fn: (v: T) => U): Container<U> {
            return Container(fn(self.value));
          },
        },
      });

      const c1 = Container(42);
      const c2 = Container("hello");

      expect(c1.get()).toBe(42);
      expect(c2.get()).toBe("hello");

      const c3 = c2.map((s) => s.length);
      expect(c3.get()).toBe(5);
    });

    it("works with complex generic constraints", () => {
      type ValidValue = string | number | bigint;
      type Value<T extends ValidValue> = T & { __brand: "Value" };

      const Value = Type({
        from<T extends ValidValue>(v: T): Value<T> {
          return v as Value<T>;
        },
        staticMethods: {
          isValue(v: unknown): v is Value<ValidValue> {
            const val = (v as any)?.valueOf?.() ?? v;
            return (
              typeof val === "string" || typeof val === "number" || typeof val === "bigint"
            );
          },
        },
        instanceMethods: {
          toString<T extends ValidValue>(self: Value<T>): string {
            return String(self);
          },
        },
      });

      const v1 = Value("test");
      const v2 = Value(123);
      const v3 = Value(456n);

      expect(Value.isValue(v1)).toBe(true);
      expect(Value.isValue(v2)).toBe(true);
      expect(Value.isValue(v3)).toBe(true);

      expect(v1.toString()).toBe("test");
      expect(v2.toString()).toBe("123");
      expect(v3.toString()).toBe("456");
    });

    it("destructured generic instance methods work without this binding", () => {
      const Wrapper = Type({
        from<T>(value: T): { value: T; __brand: "Wrapper" } {
          return { value, __brand: "Wrapper" };
        },
        staticMethods: {},
        instanceMethods: {
          unwrap<T>(self: { value: T }): T {
            return self.value;
          },
        },
      });

      const w = Wrapper(42);
      const { unwrap } = w;

      expect(unwrap()).toBe(42);
    });
  });

  describe("composition", () => {
    it("extends existing type with new methods", () => {
      const Base = Type({
        from(value: number): number & { __brand: "Base" } {
          return value as number & { __brand: "Base" };
        },
        staticMethods: {
          isBase(v: unknown): v is number & { __brand: "Base" } {
            const val = (v as any)?.valueOf?.() ?? v;
            return typeof val === "number";
          },
        },
        instanceMethods: {
          double(self): number {
            return (self as number) * 2;
          },
        },
      });

      const Extended = Type({
        from(value: number) {
          return Base(value);
        },
        staticMethods: {
          ...Base,
          verify(v: unknown) {
            const val = (v as any)?.valueOf?.() ?? v;
            return Base.isBase(v) && (val as number) > 0;
          },
        },
        instanceMethods: {
          ...Base.instanceMethods,
          triple(self): number {
            return (self as number) * 3;
          },
        },
      });

      const val = Extended(5);
      expect(val.double()).toBe(10);
      expect(val.triple()).toBe(15);
      expect(Extended.verify(val)).toBe(true);
    });
  });

  describe("no static methods", () => {
    it("works without static methods", () => {
      const Simple = Type({
        from(value: string): string & { __brand: "Simple" } {
          return value as string & { __brand: "Simple" };
        },
        instanceMethods: {
          len(self): number {
            return (self as string).length;
          },
        },
      });

      const s = Simple("test");
      expect(s.len()).toBe(4);
    });
  });

  describe("no instance methods", () => {
    it("works without instance methods", () => {
      const Simple = Type({
        from(value: string): string & { __brand: "Simple" } {
          return value as string & { __brand: "Simple" };
        },
        staticMethods: {
          validate(v: unknown): boolean {
            return typeof v === "string";
          },
        },
      });

      const s = Simple("test");
      expect(Simple.validate(s)).toBe(true);
    });
  });

  describe("no methods at all", () => {
    it("works with just the from function", () => {
      const Bare = Type({
        from(value: string): string & { __brand: "Bare" } {
          return value as string & { __brand: "Bare" };
        },
      });

      const b = Bare("test");
      expect(b).toBe("test");
    });
  });
});
