const std = @import("std");

pub fn createBlstLibrary(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
) *std.Build.Step.Compile {
    const is_wasm = target.result.cpu.arch == .wasm32 or target.result.cpu.arch == .wasm64;

    // Build blst library
    const lib = b.addLibrary(.{
        .name = "blst",
        .linkage = .static,
        .use_llvm = true, // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
            .single_threaded = if (is_wasm) true else null,
            .strip = if (is_wasm) true else null,
        }),
    });

    lib.root_module.link_libc = true;

    // For native targets, compile the checked-in assembly into this library.
    // For WASM, use portable C-only implementation.
    //
    // Do not run blst's ./build.sh here: it writes libblst.a, server.o and
    // assembly.o into the source tree on every build, nothing links them, and
    // concurrent `zig build` processes race on those files (truncated archives,
    // SIGBUS in ar).
    if (!is_wasm) {
        const asm_flags: []const []const u8 = if (target.result.os.tag == .windows)
            &.{"-D__BLST_PORTABLE__"}
        else
            &.{ "-fPIC", "-D__BLST_PORTABLE__" };
        lib.root_module.addCSourceFile(.{
            .file = b.path("packages/voltaire-zig/lib/c-kzg-4844/blst/build/assembly.S"),
            .flags = asm_flags,
        });
    }

    // Add blst source files with portable flag
    // For WASM, __BLST_PORTABLE__ ensures pure C implementation without assembly
    // For native, __BLST_PORTABLE__ provides fallback while assembly is optimized path
    // -fPIC required for shared libraries on Linux (ignored on Windows/macOS)
    const c_flags = if (is_wasm)
        &[_][]const u8{
            "-std=c99",
            "-Oz",
            "-ffunction-sections",
            "-fdata-sections",
            "-D__BLST_PORTABLE__",
            "-D__BLST_NO_ASM__",
            "-fno-sanitize=undefined",
        }
    else
        &[_][]const u8{ "-std=c99", "-fPIC", "-D__BLST_PORTABLE__", "-fno-sanitize=undefined" };

    lib.root_module.addCSourceFiles(.{
        .files = &.{
            "packages/voltaire-zig/lib/c-kzg-4844/blst/src/server.c",
        },
        .flags = c_flags,
    });

    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/c-kzg-4844/blst/bindings"));

    return lib;
}
