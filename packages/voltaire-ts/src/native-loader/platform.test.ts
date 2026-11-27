import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	getNativeExtension,
	getNativeLibCandidates,
	getNativeLibPath,
	getNativeLibPrefix,
	getPlatform,
	isNativeSupported,
	resolveNativeLibPath,
} from "./platform.js";
import {
	getNativeErrorMessage,
	NativeError,
	NativeErrorCode,
	NativeLibraryNotFoundError,
} from "./types.js";

describe("native-loader platform resolution", () => {
	const originalEnv = process.env.VOLTAIRE_NATIVE_LIB;
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(path.join(tmpdir(), "voltaire-platform-test-"));
		delete process.env.VOLTAIRE_NATIVE_LIB;
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.VOLTAIRE_NATIVE_LIB;
		} else {
			process.env.VOLTAIRE_NATIVE_LIB = originalEnv;
		}
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("detects current platform and extension", () => {
		expect(isNativeSupported()).toBe(true);
		const platform = getPlatform();
		expect([
			"darwin-arm64",
			"darwin-x64",
			"linux-arm64",
			"linux-x64",
			"win32-x64",
		]).toContain(platform);
		expect(["dylib", "so", "dll"]).toContain(getNativeExtension());
		expect(["lib", ""]).toContain(getNativeLibPrefix());
	});

	it("prioritizes VOLTAIRE_NATIVE_LIB override over all other candidates", () => {
		const fakeLib = path.join(tempDir, "custom_voltaire.dylib");
		writeFileSync(fakeLib, "placeholder");
		process.env.VOLTAIRE_NATIVE_LIB = fakeLib;

		expect(getNativeLibCandidates()).toEqual([path.resolve(fakeLib)]);
		expect(resolveNativeLibPath()).toBe(path.resolve(fakeLib));
		expect(getNativeLibPath()).toBe(path.resolve(fakeLib));
	});

	it("throws actionable NativeLibraryNotFoundError when VOLTAIRE_NATIVE_LIB points to missing file", () => {
		const missing = path.join(tempDir, "does-not-exist.dylib");
		process.env.VOLTAIRE_NATIVE_LIB = missing;

		let thrown: unknown;
		try {
			resolveNativeLibPath();
		} catch (error) {
			thrown = error;
		}
		expect(thrown).toBeInstanceOf(NativeLibraryNotFoundError);
		const err = thrown as NativeLibraryNotFoundError;
		expect(err.searchedPaths).toEqual([path.resolve(missing)]);
		expect(err.message).toContain(`@tevm/voltaire-${getPlatform()}`);
		expect(err.message).toContain(
			"zig build build-ts-native -Dwith-c-api=true",
		);
		expect(err.message).toContain("VOLTAIRE_NATIVE_LIB");
	});

	it("orders Bun FFI local candidates across native/<platform>, native/, and lib/", () => {
		const platform = getPlatform();
		const ext = getNativeExtension();
		const prefix = getNativeLibPrefix();
		const candidates = getNativeLibCandidates({ runtime: "bun-ffi" });

		const joined = candidates.join("\n");
		expect(joined).toContain(
			path.join(
				"zig-out",
				"native",
				platform,
				`${prefix}voltaire_native.${ext}`,
			),
		);
		expect(joined).toContain(
			path.join("zig-out", "native", `${prefix}primitives_ts_native.${ext}`),
		);
		expect(joined).toContain(
			path.join("zig-out", "lib", `${prefix}primitives_ts_native.${ext}`),
		);
		expect(joined).toContain(
			path.join("zig-out", "lib", `${prefix}primitives_c.${ext}`),
		);

		const platformIdx = candidates.findIndex((p) =>
			p.includes(path.join("zig-out", "native", platform)),
		);
		const flatIdx = candidates.findIndex(
			(p) =>
				p.includes(path.join("zig-out", "native")) &&
				!p.includes(path.join("zig-out", "native", platform)),
		);
		const libIdx = candidates.findIndex((p) =>
			p.includes(path.join("zig-out", "lib")),
		);
		expect(platformIdx).toBeGreaterThanOrEqual(0);
		expect(flatIdx).toBeGreaterThan(platformIdx);
		expect(libIdx).toBeGreaterThan(flatIdx);
	});

	it("includes .node addon candidates first for node-api runtime", () => {
		const platform = getPlatform();
		const candidates = getNativeLibCandidates({ runtime: "node-api" });
		expect(candidates[0]).toContain(`voltaire_native.${platform}.node`);
	});

	it("maps all primitives.h error codes to human-readable messages", () => {
		expect(getNativeErrorMessage(NativeErrorCode.SUCCESS)).toBe("Success");
		expect(getNativeErrorMessage(NativeErrorCode.OUT_OF_MEMORY)).toBe(
			"Out of memory",
		);
		expect(getNativeErrorMessage(NativeErrorCode.INVALID_INPUT)).toBe(
			"Invalid input parameter",
		);
		expect(getNativeErrorMessage(NativeErrorCode.INVALID_SIGNATURE)).toBe(
			"Invalid signature",
		);
		expect(getNativeErrorMessage(NativeErrorCode.KZG_NOT_LOADED)).toBe(
			"KZG trusted setup not loaded",
		);
		expect(getNativeErrorMessage(NativeErrorCode.KZG_INVALID_BLOB)).toBe(
			"Invalid KZG blob",
		);
		expect(getNativeErrorMessage(NativeErrorCode.KZG_INVALID_PROOF)).toBe(
			"Invalid KZG proof",
		);
		const err = new NativeError("keccak256", NativeErrorCode.INVALID_INPUT);
		expect(err.code).toBe(-5);
		expect(err.operation).toBe("keccak256");
	});
});
