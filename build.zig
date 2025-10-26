const std = @import("std");
const lib_build = @import("lib/build.zig");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // STEP 1: Verify vendored dependencies exist
    lib_build.checkVendoredDeps(b);

    // STEP 2: Verify Cargo is installed for Rust dependencies
    lib_build.checkCargoInstalled();

    // STEP 3: Build Rust crate (crypto_wrappers: bn254 + keccak FFI)
    const cargo_build_step = lib_build.createCargoBuildStep(b, optimize, target);

    // Build crypto C/Rust libraries that primitives + crypto depend on
    const blst_lib = lib_build.BlstLib.createBlstLibrary(b, target, optimize);
    const c_kzg_lib = lib_build.CKzgLib.createCKzgLibrary(b, target, optimize, blst_lib);
    const rust_crypto_lib_path = lib_build.Bn254Lib.getRustLibraryPath(b, target);

    // Install crypto libraries
    b.installArtifact(blst_lib);
    b.installArtifact(c_kzg_lib);

    // Create c_kzg module with proper bindings root
    const c_kzg_mod = b.addModule("c_kzg", .{
        .root_source_file = b.path("lib/c-kzg-4844/bindings/zig/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    c_kzg_mod.linkLibrary(c_kzg_lib);
    c_kzg_mod.linkLibrary(blst_lib);
    c_kzg_mod.addIncludePath(b.path("lib/c-kzg-4844/src"));
    c_kzg_mod.addIncludePath(b.path("lib/c-kzg-4844/blst/bindings"));

    // Crypto module - export for external packages
    const crypto_mod = b.addModule("crypto", .{
        .root_source_file = b.path("src/crypto/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    crypto_mod.addImport("c_kzg", c_kzg_mod);
    crypto_mod.addIncludePath(b.path("lib")); // For keccak_wrapper.h

    // Primitives module - export for external packages (includes Hardfork)
    const primitives_mod = b.addModule("primitives", .{
        .root_source_file = b.path("src/primitives/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    primitives_mod.addImport("crypto", crypto_mod);

    // Now add primitives to crypto (circular dependency resolved by Zig's lazy evaluation)
    crypto_mod.addImport("primitives", primitives_mod);

    // Primitives tests
    const primitives_tests = b.addTest(.{
        .name = "primitives-tests",
        .root_module = primitives_mod,
    });
    primitives_tests.linkLibrary(c_kzg_lib);
    primitives_tests.linkLibrary(blst_lib);
    primitives_tests.addObjectFile(rust_crypto_lib_path);
    primitives_tests.addIncludePath(b.path("lib")); // For Rust FFI headers
    primitives_tests.step.dependOn(cargo_build_step);
    primitives_tests.linkLibC();

    // Crypto tests
    const crypto_tests = b.addTest(.{
        .name = "crypto-tests",
        .root_module = crypto_mod,
    });
    crypto_tests.linkLibrary(c_kzg_lib);
    crypto_tests.linkLibrary(blst_lib);
    crypto_tests.addObjectFile(rust_crypto_lib_path);
    crypto_tests.addIncludePath(b.path("lib")); // For Rust FFI headers
    crypto_tests.step.dependOn(cargo_build_step);
    crypto_tests.linkLibC();

    // Precompiles module - export for external packages
    const precompiles_mod = b.addModule("precompiles", .{
        .root_source_file = b.path("src/precompiles/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    precompiles_mod.addImport("primitives", primitives_mod);
    precompiles_mod.addImport("crypto", crypto_mod);

    const precompiles_tests = b.addTest(.{
        .name = "precompiles-tests",
        .root_module = precompiles_mod,
    });
    precompiles_tests.linkLibrary(c_kzg_lib);
    precompiles_tests.linkLibrary(blst_lib);
    precompiles_tests.addObjectFile(rust_crypto_lib_path);
    precompiles_tests.addIncludePath(b.path("lib")); // For Rust FFI headers
    precompiles_tests.step.dependOn(cargo_build_step);
    precompiles_tests.linkLibC();

    const run_primitives_tests = b.addRunArtifact(primitives_tests);
    const run_crypto_tests = b.addRunArtifact(crypto_tests);
    const run_precompiles_tests = b.addRunArtifact(precompiles_tests);

    const test_step = b.step("test", "Run all tests (primitives + crypto + precompiles)");
    test_step.dependOn(&run_primitives_tests.step);
    test_step.dependOn(&run_crypto_tests.step);
    test_step.dependOn(&run_precompiles_tests.step);

    // Example: Keccak-256 hashing demonstration
    const keccak256_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/keccak256.zig"),
        .target = target,
        .optimize = optimize,
    });
    keccak256_example_mod.addImport("crypto", crypto_mod);

    const keccak256_example = b.addExecutable(.{
        .name = "keccak256_example",
        .root_module = keccak256_example_mod,
    });
    keccak256_example.linkLibrary(c_kzg_lib);
    keccak256_example.linkLibrary(blst_lib);
    keccak256_example.addObjectFile(rust_crypto_lib_path);
    keccak256_example.addIncludePath(b.path("lib")); // For Rust FFI headers
    keccak256_example.step.dependOn(cargo_build_step);
    keccak256_example.linkLibC();

    const run_keccak256_example = b.addRunArtifact(keccak256_example);
    const example_keccak256_step = b.step("example-keccak256", "Run the Keccak-256 hashing example");
    example_keccak256_step.dependOn(&run_keccak256_example.step);

    // ABI encoding/decoding example
    const abi_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/abi.zig"),
        .target = target,
        .optimize = optimize,
    });
    abi_example_mod.addImport("primitives", primitives_mod);

    const abi_example = b.addExecutable(.{
        .name = "abi_example",
        .root_module = abi_example_mod,
    });
    abi_example.linkLibrary(c_kzg_lib);
    abi_example.linkLibrary(blst_lib);
    abi_example.addObjectFile(rust_crypto_lib_path);
    abi_example.addIncludePath(b.path("lib")); // For Rust FFI headers
    abi_example.step.dependOn(cargo_build_step);
    abi_example.linkLibC();

    const run_abi_example = b.addRunArtifact(abi_example);
    const example_abi_step = b.step("example-abi", "Run the ABI encoding/decoding example");
    example_abi_step.dependOn(&run_abi_example.step);

    // secp256k1 ECDSA signature operations example
    const secp256k1_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/secp256k1.zig"),
        .target = target,
        .optimize = optimize,
    });
    secp256k1_example_mod.addImport("crypto", crypto_mod);
    secp256k1_example_mod.addImport("primitives", primitives_mod);

    const secp256k1_example = b.addExecutable(.{
        .name = "secp256k1_example",
        .root_module = secp256k1_example_mod,
    });
    secp256k1_example.linkLibrary(c_kzg_lib);
    secp256k1_example.linkLibrary(blst_lib);
    secp256k1_example.addObjectFile(rust_crypto_lib_path);
    secp256k1_example.addIncludePath(b.path("lib")); // For Rust FFI headers
    secp256k1_example.step.dependOn(cargo_build_step);
    secp256k1_example.linkLibC();

    const run_secp256k1_example = b.addRunArtifact(secp256k1_example);
    const example_secp256k1_step = b.step("example-secp256k1", "Run the secp256k1 ECDSA signature operations example");
    example_secp256k1_step.dependOn(&run_secp256k1_example.step);

    // Address primitive example
    const address_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/address.zig"),
        .target = target,
        .optimize = optimize,
    });
    address_example_mod.addImport("primitives", primitives_mod);

    const address_example = b.addExecutable(.{
        .name = "address_example",
        .root_module = address_example_mod,
    });
    address_example.linkLibrary(c_kzg_lib);
    address_example.linkLibrary(blst_lib);
    address_example.addObjectFile(rust_crypto_lib_path);
    address_example.addIncludePath(b.path("lib")); // For Rust FFI headers
    address_example.step.dependOn(cargo_build_step);
    address_example.linkLibC();

    const run_address_example = b.addRunArtifact(address_example);
    const example_address_step = b.step("example-address", "Run the Address primitive example");
    example_address_step.dependOn(&run_address_example.step);

    // Hex utilities example
    const hex_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/hex.zig"),
        .target = target,
        .optimize = optimize,
    });
    hex_example_mod.addImport("primitives", primitives_mod);

    const hex_example = b.addExecutable(.{
        .name = "hex_example",
        .root_module = hex_example_mod,
    });
    hex_example.linkLibrary(c_kzg_lib);
    hex_example.linkLibrary(blst_lib);
    hex_example.addObjectFile(rust_crypto_lib_path);
    hex_example.addIncludePath(b.path("lib")); // For Rust FFI headers
    hex_example.step.dependOn(cargo_build_step);
    hex_example.linkLibC();

    const run_hex_example = b.addRunArtifact(hex_example);
    const example_hex_step = b.step("example-hex", "Run the Hex utilities example");
    example_hex_step.dependOn(&run_hex_example.step);

    // RLP encoding/decoding example
    const rlp_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/rlp.zig"),
        .target = target,
        .optimize = optimize,
    });
    rlp_example_mod.addImport("primitives", primitives_mod);

    const rlp_example = b.addExecutable(.{
        .name = "rlp_example",
        .root_module = rlp_example_mod,
    });
    rlp_example.linkLibrary(c_kzg_lib);
    rlp_example.linkLibrary(blst_lib);
    rlp_example.addObjectFile(rust_crypto_lib_path);
    rlp_example.addIncludePath(b.path("lib")); // For Rust FFI headers
    rlp_example.step.dependOn(cargo_build_step);
    rlp_example.linkLibC();

    const run_rlp_example = b.addRunArtifact(rlp_example);
    const example_rlp_step = b.step("example-rlp", "Run the RLP encoding/decoding example");
    example_rlp_step.dependOn(&run_rlp_example.step);

    // EIP-712 typed data signing example
    const eip712_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/eip712.zig"),
        .target = target,
        .optimize = optimize,
    });
    eip712_example_mod.addImport("crypto", crypto_mod);
    eip712_example_mod.addImport("primitives", primitives_mod);

    const eip712_example = b.addExecutable(.{
        .name = "eip712_example",
        .root_module = eip712_example_mod,
    });
    eip712_example.linkLibrary(c_kzg_lib);
    eip712_example.linkLibrary(blst_lib);
    eip712_example.addObjectFile(rust_crypto_lib_path);
    eip712_example.addIncludePath(b.path("lib")); // For Rust FFI headers
    eip712_example.step.dependOn(cargo_build_step);
    eip712_example.linkLibC();

    const run_eip712_example = b.addRunArtifact(eip712_example);
    const example_eip712_step = b.step("example-eip712", "Run the EIP-712 typed data signing example");
    example_eip712_step.dependOn(&run_eip712_example.step);

    // Transaction operations example
    const transaction_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/transaction.zig"),
        .target = target,
        .optimize = optimize,
    });
    transaction_example_mod.addImport("primitives", primitives_mod);
    transaction_example_mod.addImport("crypto", crypto_mod);

    const transaction_example = b.addExecutable(.{
        .name = "transaction_example",
        .root_module = transaction_example_mod,
    });
    transaction_example.linkLibrary(c_kzg_lib);
    transaction_example.linkLibrary(blst_lib);
    transaction_example.addObjectFile(rust_crypto_lib_path);
    transaction_example.addIncludePath(b.path("lib")); // For Rust FFI headers
    transaction_example.step.dependOn(cargo_build_step);
    transaction_example.linkLibC();

    const run_transaction_example = b.addRunArtifact(transaction_example);
    const example_transaction_step = b.step("example-transaction", "Run the transaction operations example");
    example_transaction_step.dependOn(&run_transaction_example.step);

    // Generate C header from c_api.zig
    const generate_header = b.addExecutable(.{
        .name = "generate_c_header",
        .root_module = b.createModule(.{
            .root_source_file = b.path("scripts/generate_c_header.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });

    const run_generate_header = b.addRunArtifact(generate_header);

    const generate_header_step = b.step("generate-header", "Generate primitives.h from c_api.zig");
    generate_header_step.dependOn(&run_generate_header.step);

    // C API library - skip for WASM targets
    const is_wasm = target.result.cpu.arch == .wasm32 or target.result.cpu.arch == .wasm64;
    if (!is_wasm) {
        // C API library
        const c_api_lib = b.addLibrary(.{
            .name = "primitives_c",
            .linkage = .static,
            .root_module = b.createModule(.{
                .root_source_file = b.path("src/c_api.zig"),
                .target = target,
                .optimize = optimize,
            }),
        });
        c_api_lib.root_module.addImport("primitives", primitives_mod);
        c_api_lib.root_module.addImport("crypto", crypto_mod);
        c_api_lib.linkLibrary(c_kzg_lib);
        c_api_lib.linkLibrary(blst_lib);
        c_api_lib.addObjectFile(rust_crypto_lib_path);
        c_api_lib.addIncludePath(b.path("lib")); // For Rust FFI headers
        c_api_lib.step.dependOn(cargo_build_step);
        c_api_lib.step.dependOn(&run_generate_header.step); // Auto-generate header
        c_api_lib.linkLibC();

        b.installArtifact(c_api_lib);

        // C API shared library for FFI (TypeScript/Bun)
        const c_api_shared = b.addLibrary(.{
            .name = "primitives_c",
            .linkage = .dynamic,
            .root_module = b.createModule(.{
                .root_source_file = b.path("src/c_api.zig"),
                .target = target,
                .optimize = optimize,
            }),
        });
        c_api_shared.root_module.addImport("primitives", primitives_mod);
        c_api_shared.root_module.addImport("crypto", crypto_mod);
        c_api_shared.linkLibrary(c_kzg_lib);
        c_api_shared.linkLibrary(blst_lib);
        c_api_shared.addObjectFile(rust_crypto_lib_path);
        c_api_shared.addIncludePath(b.path("lib")); // For Rust FFI headers
        c_api_shared.step.dependOn(cargo_build_step);
        c_api_shared.step.dependOn(&run_generate_header.step); // Auto-generate header
        c_api_shared.linkLibC();

        b.installArtifact(c_api_shared);

        // Install C API header for external consumers (depends on generation)
        const install_header = b.addInstallFile(b.path("src/primitives.h"), "include/primitives.h");
        install_header.step.dependOn(&run_generate_header.step);
        b.getInstallStep().dependOn(&install_header.step);

        // C example executable
        const c_example = b.addExecutable(.{
            .name = "c_example",
            .root_module = b.createModule(.{
                .target = target,
                .optimize = optimize,
            }),
        });
        c_example.addCSourceFile(.{
            .file = b.path("examples/c/basic_usage.c"),
        });
        c_example.addIncludePath(b.path("src")); // For primitives.h
        c_example.linkLibrary(c_api_lib);
        c_example.linkLibC();

        const install_c_example = b.addInstallArtifact(c_example, .{});

        const run_c_example = b.addRunArtifact(c_example);
        run_c_example.step.dependOn(&install_c_example.step);

        const c_example_step = b.step("example-c", "Run the C API example");
        c_example_step.dependOn(&run_c_example.step);
    }

    // NOTE: WASM builds are supported with all features!
    // - Rust crypto_wrappers: built with portable features (tiny-keccak + arkworks pure Rust)
    // - blst: built with __BLST_PORTABLE__ and __BLST_NO_ASM__ (C-only, no assembly)
    // - c-kzg-4844: works in WASM as pure C
    // - All Zig crypto: fully compatible
    // C API library is skipped for WASM (dynamic linking not supported)
    // For JavaScript/TypeScript: use native libprimitives_c with FFI, or compile to WASM for browser

    // TypeScript/JavaScript FFI builds with optimized configurations
    if (!is_wasm) {
        // Native TypeScript bindings - ReleaseFast for maximum performance
        const ts_native_target = b.resolveTargetQuery(.{});
        addTypeScriptNativeBuild(b, ts_native_target, primitives_mod, crypto_mod, c_kzg_lib, blst_lib, rust_crypto_lib_path, cargo_build_step);
    }

    // WASM TypeScript bindings - ReleaseSmall for minimal bundle size
    const wasm_target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag = .wasi,
    });
    addTypeScriptWasmBuild(b, wasm_target, primitives_mod, crypto_mod, c_kzg_lib, blst_lib, rust_crypto_lib_path, cargo_build_step);

    // Go build and test steps (optional, requires Go toolchain)
    if (!is_wasm) {
        addGoBuildSteps(b);
    }

    // Benchmark executables for WASM size and performance measurement
    const bench_filter = b.option([]const u8, "bench-filter", "Pattern to filter benchmarks (default: \"*\")") orelse "*";
    buildBenchmarks(b, target, optimize, bench_filter, primitives_mod, crypto_mod, precompiles_mod, c_kzg_lib, blst_lib, rust_crypto_lib_path, cargo_build_step);

    // zbench performance benchmarks colocated with source code
    const zbench_filter = b.option([]const u8, "filter", "Pattern to filter zbench benchmarks (default: \"*\")") orelse "*";
    buildZBenchmarks(b, target, optimize, zbench_filter, primitives_mod, crypto_mod, precompiles_mod, c_kzg_lib, blst_lib, rust_crypto_lib_path, cargo_build_step);
}

fn buildBenchmarks(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    filter: []const u8,
    primitives_mod: *std.Build.Module,
    crypto_mod: *std.Build.Module,
    precompiles_mod: *std.Build.Module,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    rust_crypto_lib_path: std.Build.LazyPath,
    cargo_build_step: *std.Build.Step,
) void {
    // Try to open bench directory
    const bench_dir = std.fs.cwd().openDir("bench", .{ .iterate = true }) catch return;
    var walker = bench_dir.walk(b.allocator) catch return;
    defer walker.deinit();

    while (walker.next() catch null) |entry| {
        if (entry.kind != .file) continue;
        if (!std.mem.endsWith(u8, entry.basename, ".zig")) continue;

        // Check if benchmark matches filter
        if (!std.mem.eql(u8, filter, "*") and std.mem.indexOf(u8, entry.basename, filter) == null) {
            continue;
        }

        // Build path: bench/[path].zig
        const bench_path = b.fmt("bench/{s}", .{entry.path});
        const bench_name_raw = entry.basename[0 .. entry.basename.len - 4]; // Remove .zig
        const bench_name = b.fmt("bench-{s}", .{bench_name_raw});

        // Create benchmark module
        const bench_mod = b.createModule(.{
            .root_source_file = b.path(bench_path),
            .target = target,
            .optimize = optimize,
        });
        bench_mod.addImport("primitives", primitives_mod);
        bench_mod.addImport("crypto", crypto_mod);
        bench_mod.addImport("precompiles", precompiles_mod);

        // Create benchmark executable
        const bench_exe = b.addExecutable(.{
            .name = bench_name,
            .root_module = bench_mod,
        });
        bench_exe.linkLibrary(c_kzg_lib);
        bench_exe.linkLibrary(blst_lib);
        bench_exe.addObjectFile(rust_crypto_lib_path);
        bench_exe.addIncludePath(b.path("lib"));
        bench_exe.step.dependOn(cargo_build_step);
        bench_exe.linkLibC();

        b.installArtifact(bench_exe);
    }
}

fn buildZBenchmarks(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    filter: []const u8,
    primitives_mod: *std.Build.Module,
    crypto_mod: *std.Build.Module,
    precompiles_mod: *std.Build.Module,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    rust_crypto_lib_path: std.Build.LazyPath,
    cargo_build_step: *std.Build.Step,
) void {
    // Import zbench dependency
    const zbench_dep = b.dependency("zbench", .{
        .target = target,
        .optimize = optimize,
    });
    const zbench_mod = zbench_dep.module("zbench");

    // Create bench step to run all benchmarks
    const bench_step = b.step("bench", "Run zbench performance benchmarks");

    // Recursively find all *.bench.zig files in src/
    const src_dir = std.fs.cwd().openDir("src", .{ .iterate = true }) catch return;
    var walker = src_dir.walk(b.allocator) catch return;
    defer walker.deinit();

    var bench_count: u32 = 0;
    while (walker.next() catch null) |entry| {
        if (entry.kind != .file) continue;
        if (!std.mem.endsWith(u8, entry.basename, ".bench.zig")) continue;

        // Check if benchmark matches filter
        if (!std.mem.eql(u8, filter, "*") and std.mem.indexOf(u8, entry.basename, filter) == null) {
            continue;
        }

        // Build path: src/[path].bench.zig
        const bench_path = b.fmt("src/{s}", .{entry.path});
        const bench_name_raw = entry.basename[0 .. entry.basename.len - 10]; // Remove .bench.zig
        const bench_name = b.fmt("zbench-{s}", .{bench_name_raw});

        // Create benchmark module
        const bench_mod = b.createModule(.{
            .root_source_file = b.path(bench_path),
            .target = target,
            .optimize = optimize,
        });
        bench_mod.addImport("primitives", primitives_mod);
        bench_mod.addImport("crypto", crypto_mod);
        bench_mod.addImport("precompiles", precompiles_mod);
        bench_mod.addImport("zbench", zbench_mod);

        // Create benchmark executable
        const bench_exe = b.addExecutable(.{
            .name = bench_name,
            .root_module = bench_mod,
        });
        bench_exe.linkLibrary(c_kzg_lib);
        bench_exe.linkLibrary(blst_lib);
        bench_exe.addObjectFile(rust_crypto_lib_path);
        bench_exe.addIncludePath(b.path("lib"));
        bench_exe.step.dependOn(cargo_build_step);
        bench_exe.linkLibC();

        b.installArtifact(bench_exe);

        // Add run step for this benchmark
        const run_bench = b.addRunArtifact(bench_exe);
        bench_step.dependOn(&run_bench.step);
        bench_count += 1;
    }

    // Add informational message if no benchmarks found
    if (bench_count == 0) {
        const no_bench_msg = if (std.mem.eql(u8, filter, "*"))
            "No benchmarks found"
        else
            b.fmt("No benchmarks found matching filter: {s}", .{filter});

        const echo_step = b.addSystemCommand(&[_][]const u8{ "echo", no_bench_msg });
        bench_step.dependOn(&echo_step.step);
    }
}

fn addTypeScriptNativeBuild(
    b: *std.Build,
    ts_target: std.Build.ResolvedTarget,
    primitives_mod: *std.Build.Module,
    crypto_mod: *std.Build.Module,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    rust_crypto_lib_path: std.Build.LazyPath,
    cargo_build_step: *std.Build.Step,
) void {
    // Native TypeScript FFI library with ReleaseFast optimization
    const ts_native_lib = b.addLibrary(.{
        .name = "primitives_ts_native",
        .linkage = .dynamic,
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/c_api.zig"),
            .target = ts_target,
            .optimize = .ReleaseFast, // Maximum performance for native
        }),
    });
    ts_native_lib.root_module.addImport("primitives", primitives_mod);
    ts_native_lib.root_module.addImport("crypto", crypto_mod);
    ts_native_lib.linkLibrary(c_kzg_lib);
    ts_native_lib.linkLibrary(blst_lib);
    ts_native_lib.addObjectFile(rust_crypto_lib_path);
    ts_native_lib.addIncludePath(b.path("lib"));
    ts_native_lib.step.dependOn(cargo_build_step);
    ts_native_lib.linkLibC();

    // Install to native/ directory
    const install_native = b.addInstallArtifact(ts_native_lib, .{
        .dest_dir = .{ .override = .{ .custom = "native" } },
    });

    const build_ts_native_step = b.step("build-ts-native", "Build native TypeScript FFI bindings with ReleaseFast");
    build_ts_native_step.dependOn(&install_native.step);
}

fn addTypeScriptWasmBuild(
    b: *std.Build,
    wasm_target: std.Build.ResolvedTarget,
    primitives_mod: *std.Build.Module,
    crypto_mod: *std.Build.Module,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    rust_crypto_lib_path: std.Build.LazyPath,
    cargo_build_step: *std.Build.Step,
) void {
    // WASM TypeScript executable with ReleaseSmall optimization
    // Note: WASM must be built as executable, not library (no dynamic linking in WASM)
    const ts_wasm_exe = b.addExecutable(.{
        .name = "primitives_ts_wasm",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/c_api.zig"),
            .target = wasm_target,
            .optimize = .ReleaseSmall, // Minimal size for WASM
        }),
    });
    ts_wasm_exe.root_module.addImport("primitives", primitives_mod);
    ts_wasm_exe.root_module.addImport("crypto", crypto_mod);
    ts_wasm_exe.linkLibrary(c_kzg_lib);
    ts_wasm_exe.linkLibrary(blst_lib);
    ts_wasm_exe.addObjectFile(rust_crypto_lib_path);
    ts_wasm_exe.addIncludePath(b.path("lib"));
    ts_wasm_exe.step.dependOn(cargo_build_step);
    ts_wasm_exe.rdynamic = true; // Export all symbols
    // Note: WASM reactor pattern - main() exists but not used

    // Install to wasm/ directory with .wasm extension
    const install_wasm = b.addInstallArtifact(ts_wasm_exe, .{
        .dest_dir = .{ .override = .{ .custom = "wasm" } },
    });

    const build_ts_wasm_step = b.step("build-ts-wasm", "Build WASM TypeScript bindings with ReleaseSmall");
    build_ts_wasm_step.dependOn(&install_wasm.step);
}

fn addGoBuildSteps(b: *std.Build) void {
    // go mod download step
    const go_mod_download = b.addSystemCommand(&[_][]const u8{ "go", "mod", "download" });

    const go_step = b.step("go", "Download Go dependencies");
    go_step.dependOn(&go_mod_download.step);

    // go test step - runs tests in src/...
    const go_test = b.addSystemCommand(&[_][]const u8{ "go", "test", "-v", "./src/..." });
    // Go tests depend on the C library being built
    // Note: Users must run 'zig build' before 'zig build test-go' to ensure C library exists

    const test_go_step = b.step("test-go", "Run Go tests (requires 'zig build' first)");
    test_go_step.dependOn(&go_test.step);

    // go build step - verifies Go code compiles
    const go_build = b.addSystemCommand(&[_][]const u8{ "go", "build", "./src/..." });

    const build_go_step = b.step("build-go", "Build Go packages (requires 'zig build' first)");
    build_go_step.dependOn(&go_build.step);
}
