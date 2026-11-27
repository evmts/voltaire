const std = @import("std");

pub fn createWallyLibrary(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
) *std.Build.Step.Compile {
    const lib = b.addLibrary(.{
        .name = "wallycore",
        .linkage = .static,
        .use_llvm = true,
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
        }),
    });

    lib.root_module.addCSourceFile(.{
        .file = b.path("packages/voltaire-zig/lib/libwally-core/src/amalgamation/combined.c"),
        .flags = &.{
            "-DBUILD_ELEMENTS",
            "-DUSE_ECMULT_STATIC_PRECOMPUTATION",
            "-DECMULT_WINDOW_SIZE=15",
            "-DWALLY_CORE_BUILD",
            "-std=c99",
            "-Wno-unused-function",
            "-fno-sanitize=undefined",
            "-fPIC",
        },
    });

    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/libwally-core"));
    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/libwally-core/include"));
    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/libwally-core/src"));
    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/libwally-core/src/ccan"));
    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/libwally-core/src/secp256k1"));
    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/libwally-core/src/secp256k1/include"));

    lib.root_module.link_libc = true;
    return lib;
}
