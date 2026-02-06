import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Schema from "effect/Schema";
import * as Base64 from "./index.js";

describe("Base64.Schema", () => {
  it("validates standard Base64", () => {
    const result = Schema.decodeSync(Base64.Schema)("SGVsbG8gV29ybGQ=");
    expect(typeof result).toBe("string");
  });

  it("validates URL-safe Base64", () => {
    const result = Schema.decodeSync(Base64.UrlSchema)("SGVsbG8tV29ybGQ_");
    expect(typeof result).toBe("string");
  });
});

describe("Base64.from", () => {
  it("creates BrandedBase64 from string", async () => {
    const result = await Effect.runPromise(Base64.from("SGVsbG8="));
    expect(typeof result).toBe("string");
  });

  it("creates BrandedBase64Url from string", async () => {
    // URL-safe Base64 doesn't use padding (=) and uses - and _ instead of + and /
    const result = await Effect.runPromise(Base64.fromUrlSafe("SGVsbG8"));
    expect(typeof result).toBe("string");
  });
});

describe("Base64 encoding", () => {
  it("encodes bytes to Base64", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = Base64.encode(bytes);
    expect(encoded).toBe("SGVsbG8=");
  });

  it("encodes string to Base64", () => {
    const encoded = Base64.encodeString("Hello");
    expect(encoded).toBe("SGVsbG8=");
  });
});

describe("Base64 decoding", () => {
  it("decodes Base64 to bytes", async () => {
    const bytes = await Effect.runPromise(Base64.decode("SGVsbG8="));
    expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it("decodes Base64 to string", async () => {
    const str = await Effect.runPromise(Base64.decodeToString("SGVsbG8="));
    expect(str).toBe("Hello");
  });
});

describe("Base64 validation", () => {
  it("validates correct Base64", () => {
    expect(Base64.isValid("SGVsbG8=")).toBe(true);
  });

  it("rejects invalid Base64", () => {
    expect(Base64.isValid("!!!invalid!!!")).toBe(false);
  });
});

describe("Base64 size calculation", () => {
  it("calculates encoded size", () => {
    expect(Base64.calcEncodedSize(5)).toBe(8);
  });

  it("calculates decoded size from length", () => {
    // calcDecodedSize takes the length of the encoded string, not the string itself
    expect(Base64.calcDecodedSize(8)).toBe(4); // 8 chars -> 4 bytes (accounting for padding)
  });
});
