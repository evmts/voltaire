import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bunFfiSymbols } from "./bun-ffi.js";

const zigSrc = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../../voltaire-zig/src",
);

/** Maps a Zig C ABI type to the Bun FFI type name that matches it. */
function ffiType(zigType: string): string {
	const t = zigType.trim();
	if (/^\[\*:0\]const u8$/.test(t)) return "cstring";
	if (/^\??(\*|\[\*\])/.test(t) || /^\??\w+Handle$/.test(t)) return "ptr";
	const scalar: Record<string, string> = {
		usize: "u64",
		u64: "u64",
		u8: "u8",
		c_int: "i32",
		i32: "i32",
		bool: "bool",
		void: "void",
	};
	const mapped = scalar[t];
	if (!mapped) throw new Error(`No Bun FFI mapping for Zig type ${t}`);
	return mapped;
}

/** Collects every raw `export fn` signature under packages/voltaire-zig/src. */
function zigExports(): Map<string, { params: string[]; ret: string }> {
	const out = new Map<string, { params: string[]; ret: string }>();
	const files = readdirSync(zigSrc, { recursive: true })
		.map(String)
		.filter((f) => f.endsWith(".zig"));
	const fn =
		/export fn (\w+)\(([^)]*)\)\s*(?:callconv\([^)]*\)\s*)?([^{]+?)\s*\{/g;
	for (const file of files) {
		const code = readFileSync(path.join(zigSrc, file), "utf8");
		for (const [, name, params, ret] of code.matchAll(fn)) {
			out.set(name as string, {
				params: (params as string)
					.split(",")
					.map((p) => p.trim())
					.filter(Boolean)
					.map((p) => p.slice(p.indexOf(":") + 1)),
				ret: ret as string,
			});
		}
	}
	return out;
}

describe("bunFfiSymbols", () => {
	const exported = zigExports();

	it.each(Object.keys(bunFfiSymbols))("%s matches its Zig export", (name) => {
		const zig = exported.get(name);
		expect(zig, `${name} is not exported by voltaire-zig`).toBeDefined();
		if (!zig) return;
		const declared = bunFfiSymbols[name as keyof typeof bunFfiSymbols];
		expect({ args: [...declared.args], returns: declared.returns }).toEqual({
			args: zig.params.map(ffiType),
			returns: ffiType(zig.ret),
		});
	});
});
