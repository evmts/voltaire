const std = @import("std");
const asset_generator = @import("build_utils/asset_generator.zig");
const rust_build = @import("build_utils/rust_build.zig");
const tests = @import("build_utils/tests.zig");
const wasm = @import("build_utils/wasm.zig");
const devtool = @import("build_utils/devtool.zig");
const typescript = @import("build_utils/typescript.zig");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});

    const optimize = b.standardOptimizeOption(.{});

    const no_precompiles = b.option(bool, "no_precompiles", "Disable all EVM precompiles for minimal build") orelse false;

    const force_bn254 = b.option(bool, "force_bn254", "Force BN254 even on Ubuntu") orelse false;
    const is_ubuntu_native = target.result.os.tag == .linux and target.result.cpu.arch == .x86_64 and !force_bn254;

    const no_bn254 = no_precompiles or is_ubuntu_native;

    const build_options = b.addOptions();
    build_options.addOption(bool, "no_precompiles", no_precompiles);
    build_options.addOption(bool, "no_bn254", no_bn254);
    const enable_tracing = b.option(bool, "enable-tracing", "Enable EVM instruction tracing (compile-time)") orelse false;
    build_options.addOption(bool, "enable_tracing", enable_tracing);
    const disable_tailcall_dispatch = b.option(bool, "disable-tailcall-dispatch", "Disable tailcall-based interpreter dispatch (use switch instead)") orelse true;
    build_options.addOption(bool, "disable_tailcall_dispatch", disable_tailcall_dispatch);
    const build_options_mod = build_options.createModule();

    const lib_mod = b.createModule(.{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    lib_mod.addIncludePath(b.path("src/bn254_wrapper"));
    lib_mod.addImport("build_options", build_options_mod);

    const zbench_dep = b.dependency("zbench", .{
        .target = target,
        .optimize = optimize,
    });

    // Build blst assembly first
    const blst_build_cmd = b.addSystemCommand(&.{
        "sh", "-c", "cd lib/c-kzg-4844/blst && ./build.sh",
    });
    
    // Build blst library
    const blst_lib = b.addLibrary(.{
        .name = "blst",
        .linkage = .static,
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
        }),
    });
    blst_lib.linkLibC();
    blst_lib.step.dependOn(&blst_build_cmd.step);
    
    // Add blst source files
    blst_lib.addCSourceFiles(.{
        .files = &.{
            "lib/c-kzg-4844/blst/src/server.c",
        },
        .flags = &.{"-std=c99", "-D__BLST_PORTABLE__", "-fno-sanitize=undefined"},
    });
    blst_lib.addAssemblyFile(b.path("lib/c-kzg-4844/blst/build/assembly.S"));
    blst_lib.addIncludePath(b.path("lib/c-kzg-4844/blst/bindings"));
    
    // Build c-kzg-4844 from source
    const c_kzg_lib = b.addLibrary(.{
        .name = "c-kzg-4844",
        .linkage = .static,
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
        }),
    });
    c_kzg_lib.linkLibC();
    c_kzg_lib.linkLibrary(blst_lib);
    c_kzg_lib.addCSourceFiles(.{
        .files = &.{
            "lib/c-kzg-4844/src/ckzg.c",
        },
        .flags = &.{"-std=c99", "-fno-sanitize=undefined"},
    });
    c_kzg_lib.addIncludePath(b.path("lib/c-kzg-4844/src"));
    c_kzg_lib.addIncludePath(b.path("lib/c-kzg-4844/blst/bindings"));
    
    const c_kzg_mod = b.createModule(.{
        .root_source_file = b.path("lib/c-kzg-4844/bindings/zig/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    c_kzg_mod.linkLibrary(c_kzg_lib);
    c_kzg_mod.linkLibrary(blst_lib);
    c_kzg_mod.addIncludePath(b.path("lib/c-kzg-4844/src"));
    c_kzg_mod.addIncludePath(b.path("lib/c-kzg-4844/blst/bindings"));

    const primitives_mod = b.createModule(.{
        .root_source_file = b.path("src/primitives/root.zig"),
        .target = target,
        .optimize = optimize,
    });

    const crypto_mod = b.createModule(.{
        .root_source_file = b.path("src/crypto/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    crypto_mod.addImport("primitives", primitives_mod);
    crypto_mod.addImport("c_kzg", c_kzg_mod);
    primitives_mod.addImport("crypto", crypto_mod);

    const utils_mod = b.createModule(.{
        .root_source_file = b.path("src/utils.zig"),
        .target = target,
        .optimize = optimize,
    });

    const trie_mod = b.createModule(.{
        .root_source_file = b.path("src/trie/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    trie_mod.addImport("primitives", primitives_mod);
    trie_mod.addImport("utils", utils_mod);

    const provider_mod = b.createModule(.{
        .root_source_file = b.path("src/provider/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    provider_mod.addImport("primitives", primitives_mod);

    const rust_target = switch (target.result.os.tag) {
        .linux => switch (target.result.cpu.arch) {
            .x86_64 => "x86_64-unknown-linux-gnu",
            .aarch64 => "aarch64-unknown-linux-gnu",
            else => null,
        },
        .macos => switch (target.result.cpu.arch) {
            .x86_64 => "x86_64-apple-darwin",
            .aarch64 => "aarch64-apple-darwin",
            else => null,
        },
        else => null,
    };

    const workspace_build_step = if (rust_target != null) blk: {
        const rust_cmd = b.addSystemCommand(&[_][]const u8{
            "cargo",     "build",
            "--profile", if (optimize == .Debug) "dev" else "release",
        });
        if (rust_target) |target_triple| {
            rust_cmd.addArgs(&[_][]const u8{ "--target", target_triple });
        }
        break :blk rust_cmd;
    } else null;

    const bn254_lib = if (!no_bn254 and rust_target != null) blk: {
        const lib = b.addLibrary(.{
            .name = "bn254_wrapper",
            .root_module = b.createModule(.{
                .target = target,
                .optimize = optimize,
            }),
        });

        const profile_dir = if (optimize == .Debug) "debug" else "release";
        const lib_path = if (rust_target) |target_triple|
            b.fmt("target/{s}/{s}/libbn254_wrapper.a", .{ target_triple, profile_dir })
        else
            b.fmt("target/{s}/libbn254_wrapper.a", .{profile_dir});

        lib.addObjectFile(b.path(lib_path));
        lib.linkLibC();
        lib.addIncludePath(b.path("src/bn254_wrapper"));

        if (workspace_build_step) |build_step| {
            lib.step.dependOn(&build_step.step);
        }

        break :blk lib;
    } else null;

    const evm_mod = b.createModule(.{
        .root_source_file = b.path("src/evm/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    evm_mod.addImport("primitives", primitives_mod);
    evm_mod.addImport("crypto", crypto_mod);
    evm_mod.addImport("build_options", build_options_mod);
    evm_mod.addImport("zbench", zbench_dep.module("zbench"));
    evm_mod.addIncludePath(b.path("src/revm_wrapper"));

    if (bn254_lib) |bn254| {
        evm_mod.linkLibrary(bn254);
        evm_mod.addIncludePath(b.path("src/bn254_wrapper"));
    }

    const revm_lib = if (rust_target != null) blk: {
        const lib = b.addLibrary(.{
            .name = "revm_wrapper",
            .root_module = b.createModule(.{
                .target = target,
                .optimize = optimize,
            }),
        });

        const profile_dir = if (optimize == .Debug) "debug" else "release";
        const lib_path = if (rust_target) |target_triple|
            b.fmt("target/{s}/{s}/librevm_wrapper.a", .{ target_triple, profile_dir })
        else
            b.fmt("target/{s}/librevm_wrapper.a", .{profile_dir});

        lib.addObjectFile(b.path(lib_path));
        lib.linkLibC();
        lib.addIncludePath(b.path("src/revm_wrapper"));

        if (workspace_build_step) |build_step| {
            lib.step.dependOn(&build_step.step);
        }

        break :blk lib;
    } else null;

    const revm_mod = b.createModule(.{
        .root_source_file = b.path("src/revm_wrapper/revm.zig"),
        .target = target,
        .optimize = optimize,
    });
    revm_mod.addImport("primitives", primitives_mod);

    if (revm_lib) |revm| {
        revm_mod.linkLibrary(revm);
        revm_mod.addIncludePath(b.path("src/revm_wrapper"));
    }

    const compilers_mod = b.createModule(.{
        .root_source_file = b.path("src/compilers/package.zig"),
        .target = target,
        .optimize = optimize,
    });
    compilers_mod.addImport("primitives", primitives_mod);
    compilers_mod.addImport("evm", evm_mod);

    lib_mod.addImport("primitives", primitives_mod);
    lib_mod.addImport("crypto", crypto_mod);
    lib_mod.addImport("evm", evm_mod);
    lib_mod.addImport("provider", provider_mod);
    lib_mod.addImport("compilers", compilers_mod);
    lib_mod.addImport("trie", trie_mod);
    if (revm_lib != null) {
        lib_mod.addImport("revm", revm_mod);
    }

    const exe_mod = b.createModule(.{ .root_source_file = b.path("src/main.zig"), .target = target, .optimize = optimize });
    exe_mod.addImport("Guillotine_lib", lib_mod);
    const lib = b.addLibrary(.{
        .linkage = .static,
        .name = "Guillotine",
        .root_module = lib_mod,
    });

    if (bn254_lib) |bn254| {
        lib.linkLibrary(bn254);
        lib.addIncludePath(b.path("src/bn254_wrapper"));
    }

    b.installArtifact(lib);

    const shared_lib = b.addLibrary(.{
        .linkage = .dynamic,
        .name = "Guillotine",
        .root_module = lib_mod,
    });

    if (bn254_lib) |bn254| {
        shared_lib.linkLibrary(bn254);
        shared_lib.addIncludePath(b.path("src/bn254_wrapper"));
    }

    b.installArtifact(shared_lib);

    const exe = b.addExecutable(.{
        .name = "Guillotine",
        .root_module = exe_mod,
    });

    b.installArtifact(exe);

    const wasm_target = wasm.setupWasmTarget(b);
    const wasm_optimize = optimize;

    const wasm_primitives_mod = wasm.createWasmModule(b, "src/primitives/root.zig", wasm_target, wasm_optimize);

    const wasm_crypto_mod = wasm.createWasmModule(b, "src/crypto/root.zig", wasm_target, wasm_optimize);
    wasm_crypto_mod.addImport("primitives", wasm_primitives_mod);

    const wasm_evm_mod = wasm.createWasmModule(b, "src/evm/root.zig", wasm_target, wasm_optimize);
    wasm_evm_mod.addImport("primitives", wasm_primitives_mod);
    wasm_evm_mod.addImport("crypto", wasm_crypto_mod);
    wasm_evm_mod.addImport("build_options", build_options_mod);

    const wasm_lib_mod = wasm.createWasmModule(b, "src/root.zig", wasm_target, wasm_optimize);
    wasm_lib_mod.addImport("primitives", wasm_primitives_mod);
    wasm_lib_mod.addImport("evm", wasm_evm_mod);

    const wasm_lib_build = wasm.buildWasmExecutable(b, .{
        .name = "guillotine",
        .root_source_file = "src/root.zig",
        .dest_sub_path = "guillotine.wasm",
    }, wasm_lib_mod);

    const wasm_primitives_lib_mod = wasm.createWasmModule(b, "src/primitives_c.zig", wasm_target, wasm_optimize);
    wasm_primitives_lib_mod.addImport("primitives", wasm_primitives_mod);

    const wasm_primitives_build = wasm.buildWasmExecutable(b, .{
        .name = "guillotine-primitives",
        .root_source_file = "src/primitives_c.zig",
        .dest_sub_path = "guillotine-primitives.wasm",
    }, wasm_primitives_lib_mod);

    const wasm_size_step = wasm.addWasmSizeReportStep(
        b,
        &[_][]const u8{ "guillotine.wasm", "guillotine-primitives.wasm" },
        &[_]*std.Build.Step{
            &wasm_lib_build.install.step,
            &wasm_primitives_build.install.step,
        },
    );

    const wasm_step = b.step("wasm", "Build all WASM libraries and show bundle sizes");
    wasm_step.dependOn(&wasm_size_step.step);

    const wasm_primitives_step = b.step("wasm-primitives", "Build primitives-only WASM library");
    wasm_primitives_step.dependOn(&wasm_primitives_build.install.step);

    const wasm_debug_mod = wasm.createWasmModule(b, "src/root.zig", wasm_target, .Debug);
    wasm_debug_mod.addImport("primitives", wasm_primitives_mod);
    wasm_debug_mod.addImport("evm", wasm_evm_mod);

    const wasm_debug_build = wasm.buildWasmExecutable(b, .{
        .name = "guillotine-debug",
        .root_source_file = "src/root.zig",
        .dest_sub_path = "../bin/guillotine-debug.wasm",
        .debug_build = true,
    }, wasm_debug_mod);

    const wasm_debug_step = b.step("wasm-debug", "Build debug WASM for analysis");
    wasm_debug_step.dependOn(&wasm_debug_build.install.step);

    const run_cmd = b.addRunArtifact(exe);
    run_cmd.step.dependOn(b.getInstallStep());

    if (b.args) |args| {
        run_cmd.addArgs(args);
    }

    const run_step = b.step("run", "Run the app");
    run_step.dependOn(&run_cmd.step);

    const npm_check = b.addSystemCommand(&[_][]const u8{ "which", "npm" });
    npm_check.addCheck(.{ .expect_stdout_match = "npm" });

    const npm_install = b.addSystemCommand(&[_][]const u8{ "npm", "install" });
    npm_install.setCwd(b.path("src/devtool"));
    npm_install.step.dependOn(&npm_check.step);

    const npm_build = b.addSystemCommand(&[_][]const u8{ "npm", "run", "build" });
    npm_build.setCwd(b.path("src/devtool"));
    npm_build.step.dependOn(&npm_install.step);

    const generate_assets = asset_generator.GenerateAssetsStep.init(b, "src/devtool/dist", "src/devtool/assets.zig");
    generate_assets.step.dependOn(&npm_build.step);

    const devtool_mod = b.createModule(.{
        .root_source_file = b.path("src/devtool/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    devtool_mod.addImport("Guillotine_lib", lib_mod);
    devtool_mod.addImport("evm", evm_mod);
    devtool_mod.addImport("primitives", primitives_mod);
    devtool_mod.addImport("provider", provider_mod);

    const devtool_exe = b.addExecutable(.{
        .name = "guillotine-devtool",
        .root_module = devtool_mod,
    });
    if (target.result.os.tag == .macos) {
        const swift_compile = b.addSystemCommand(&[_][]const u8{
            "swiftc",
            "-emit-library",
            "-parse-as-library",
            "-target",
            "arm64-apple-macosx15.0",
            "-o",
            "zig-out/libnative_menu_swift.dylib",
            "src/devtool/native_menu.swift",
        });

        const mkdir_cmd = b.addSystemCommand(&[_][]const u8{
            "mkdir", "-p", "zig-out",
        });
        swift_compile.step.dependOn(&mkdir_cmd.step);

        devtool_exe.addLibraryPath(b.path("zig-out"));
        devtool_exe.linkSystemLibrary("native_menu_swift");
        devtool_exe.step.dependOn(&swift_compile.step);

        devtool_exe.addLibraryPath(.{ .cwd_relative = "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/macosx" });
        devtool_exe.addLibraryPath(.{ .cwd_relative = "/usr/lib/swift" });
    }

    devtool_exe.linkLibC();
    if (target.result.os.tag == .macos) {
        devtool_exe.linkFramework("WebKit");
        devtool_exe.linkFramework("AppKit");
        devtool_exe.linkFramework("Foundation");
    }

    devtool_exe.step.dependOn(&generate_assets.step);

    const run_devtool_cmd = b.addRunArtifact(devtool_exe);
    run_devtool_cmd.step.dependOn(b.getInstallStep());

    const devtool_step = b.step("devtool", "Build and run the Ethereum devtool");
    devtool_step.dependOn(&run_devtool_cmd.step);

    const build_devtool_step = b.step("build-devtool", "Build the Ethereum devtool (without running)");
    build_devtool_step.dependOn(b.getInstallStep());

    if (target.result.os.tag == .macos) {
        const bundle_dir = "macos/GuillotineDevtool.app/Contents/MacOS";
        const mkdir_bundle = b.addSystemCommand(&[_][]const u8{
            "mkdir", "-p", bundle_dir,
        });

        const copy_to_bundle = b.addSystemCommand(&[_][]const u8{
            "cp", "-f", "zig-out/bin/guillotine-devtool", bundle_dir,
        });
        copy_to_bundle.step.dependOn(&devtool_exe.step);
        copy_to_bundle.step.dependOn(&mkdir_bundle.step);

        const macos_app_step = b.step("macos-app", "Create macOS app bundle");
        macos_app_step.dependOn(&copy_to_bundle.step);

        const create_dmg = b.addSystemCommand(&[_][]const u8{
            "scripts/create-dmg-fancy.sh",
        });
        create_dmg.step.dependOn(&copy_to_bundle.step);

        const dmg_step = b.step("macos-dmg", "Create macOS DMG installer");
        dmg_step.dependOn(&create_dmg.step);
    }

    const have_crash_debug = blk: {
        std.fs.cwd().access("src/crash-debug.zig", .{}) catch break :blk false;
        break :blk true;
    };
    if (have_crash_debug) {
        const crash_debug_exe = b.addExecutable(.{
            .name = "crash-debug",
            .root_module = b.createModule(.{
                .root_source_file = b.path("src/crash-debug.zig"),
                .target = target,
            }),
        });
        crash_debug_exe.root_module.addImport("evm", evm_mod);
        crash_debug_exe.root_module.addImport("primitives", primitives_mod);
        b.installArtifact(crash_debug_exe);

        const run_crash_debug_cmd = b.addRunArtifact(crash_debug_exe);
        const crash_debug_step = b.step("crash-debug", "Run crash debugging tool");
        crash_debug_step.dependOn(&run_crash_debug_cmd.step);
    }

    const have_simple_crash = blk: {
        std.fs.cwd().access("src/simple-crash-test.zig", .{}) catch break :blk false;
        break :blk true;
    };
    if (have_simple_crash) {
        const simple_crash_test_exe = b.addExecutable(.{
            .name = "simple-crash-test",
            .root_module = b.createModule(.{
                .root_source_file = b.path("src/simple-crash-test.zig"),
                .target = target,
                .optimize = .Debug,
            }),
        });
        simple_crash_test_exe.root_module.addImport("evm", evm_mod);
        simple_crash_test_exe.root_module.addImport("primitives", primitives_mod);
        b.installArtifact(simple_crash_test_exe);

        const run_simple_crash_test_cmd = b.addRunArtifact(simple_crash_test_exe);
        const simple_crash_test_step = b.step("simple-crash-test", "Run simple crash test");
        simple_crash_test_step.dependOn(&run_simple_crash_test_cmd.step);
    }

    const evm_runner_exe = b.addExecutable(.{
        .name = "evm-runner",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/evms/zig/src/main.zig"),
            .target = target,
            .optimize = .ReleaseFast,
        }),
    });
    evm_runner_exe.root_module.addImport("evm", evm_mod);
    evm_runner_exe.root_module.addImport("primitives", primitives_mod);
    evm_runner_exe.linkLibrary(c_kzg_lib);
    evm_runner_exe.linkLibrary(blst_lib);
    evm_runner_exe.linkLibC();
    if (bn254_lib) |bn254| {
        evm_runner_exe.linkLibrary(bn254);
        evm_runner_exe.addIncludePath(b.path("src/bn254_wrapper"));
    }

    b.installArtifact(evm_runner_exe);

    const run_evm_runner_cmd = b.addRunArtifact(evm_runner_exe);
    if (b.args) |args| {
        run_evm_runner_cmd.addArgs(args);
    }

    const evm_runner_step = b.step("evm-runner", "Run the EVM benchmark runner");
    evm_runner_step.dependOn(&run_evm_runner_cmd.step);

    const build_evm_runner_step = b.step("build-evm-runner", "Build the EVM benchmark runner (ReleaseFast)");
    build_evm_runner_step.dependOn(&b.addInstallArtifact(evm_runner_exe, .{}).step);

    const evm_runner_small_exe = b.addExecutable(.{
        .name = "evm-runner-small",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/evms/zig/src/main.zig"),
            .target = target,
            .optimize = .ReleaseSmall,
        }),
    });
    evm_runner_small_exe.root_module.addImport("evm", evm_mod);
    evm_runner_small_exe.root_module.addImport("primitives", primitives_mod);
    evm_runner_small_exe.linkLibrary(c_kzg_lib);
    evm_runner_small_exe.linkLibrary(blst_lib);
    evm_runner_small_exe.linkLibC();
    if (bn254_lib) |bn254| {
        evm_runner_small_exe.linkLibrary(bn254);
        evm_runner_small_exe.addIncludePath(b.path("src/bn254_wrapper"));
    }

    b.installArtifact(evm_runner_small_exe);

    const build_evm_runner_small_step = b.step("build-evm-runner-small", "Build the EVM benchmark runner (ReleaseSmall)");
    build_evm_runner_small_step.dependOn(&b.addInstallArtifact(evm_runner_small_exe, .{}).step);

    const debug_runner_exe = b.addExecutable(.{
        .name = "debug-runner",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/evms/zig/src/debug.zig"),
            .target = target,
            .optimize = .Debug,
        }),
    });
    debug_runner_exe.root_module.addImport("evm", evm_mod);
    debug_runner_exe.root_module.addImport("primitives", primitives_mod);

    b.installArtifact(debug_runner_exe);

    const build_debug_runner_step = b.step("build-debug-runner", "Build the debug EVM runner");
    build_debug_runner_step.dependOn(&b.addInstallArtifact(debug_runner_exe, .{}).step);

    // Add zbench benchmark for BN254
    const zbench_module = b.dependency("zbench", .{
        .target = target,
        .optimize = optimize,
    }).module("zbench");

    const zbench_bn254 = b.addTest(.{
        .name = "zbench-bn254",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/crypto/bn254/zbench_benchmarks.zig"),
            .target = target,
            .optimize = .ReleaseFast,
        }),
    });
    zbench_bn254.root_module.addImport("zbench", zbench_module);

    const run_zbench_bn254 = b.addRunArtifact(zbench_bn254);

    const zbench_bn254_step = b.step("bench-bn254", "Run zbench BN254 benchmarks");
    zbench_bn254_step.dependOn(&run_zbench_bn254.step);

    const poop_runner_exe = b.addExecutable(.{
        .name = "poop-runner",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/poop_runner.zig"),
            .target = target,
            .optimize = .ReleaseFast,
        }),
    });

    b.installArtifact(poop_runner_exe);

    const run_poop_cmd = b.addRunArtifact(poop_runner_exe);
    run_poop_cmd.step.dependOn(build_evm_runner_step);
    if (b.args) |args| {
        run_poop_cmd.addArgs(args);
    }

    const poop_step = b.step("poop", "Run poop benchmark on snailtracer (Linux only)");
    poop_step.dependOn(&run_poop_cmd.step);

    // Build real orchestrator
    const clap_dep = b.dependency("clap", .{
        .target = target,
        .optimize = optimize,
    });
    
    const orchestrator_exe = b.addExecutable(.{
        .name = "orchestrator",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/src/main.zig"),
            .target = target,
            .optimize = .ReleaseFast,
        }),
    });
    orchestrator_exe.root_module.addImport("clap", clap_dep.module("clap"));

    b.installArtifact(orchestrator_exe);

    const run_orchestrator_cmd = b.addRunArtifact(orchestrator_exe);
    if (b.args) |args| {
        run_orchestrator_cmd.addArgs(args);
    }

    const orchestrator_step = b.step("orchestrator", "Run the benchmark orchestrator");
    orchestrator_step.dependOn(&run_orchestrator_cmd.step);

    const build_orchestrator_step = b.step("build-orchestrator", "Build the benchmark orchestrator (ReleaseFast)");
    build_orchestrator_step.dependOn(&b.addInstallArtifact(orchestrator_exe, .{}).step);

    const release_step = b.step("release", "Build release artifacts (evm-runner, evm-runner-small)");
    release_step.dependOn(build_evm_runner_step);
    release_step.dependOn(build_evm_runner_small_step);

    const geth_runner_build = b.addSystemCommand(&[_][]const u8{ "go", "build", "-o", "runner", "runner.go" });
    geth_runner_build.setCwd(b.path("bench/evms/geth"));

    const evmone_cmake_configure = b.addSystemCommand(&[_][]const u8{ "cmake", "-S", "bench/evms/evmone", "-B", "bench/evms/evmone/build", "-DCMAKE_BUILD_TYPE=Release", "-DCMAKE_POLICY_VERSION_MINIMUM=3.5" });
    evmone_cmake_configure.setCwd(b.path(""));

    const evmone_cmake_build = b.addSystemCommand(&[_][]const u8{ "cmake", "--build", "bench/evms/evmone/build", "--parallel" });
    evmone_cmake_build.setCwd(b.path(""));
    evmone_cmake_build.step.dependOn(&evmone_cmake_configure.step);

    const opcode_test_lib = b.addLibrary(.{
        .name = "guillotine_opcode_test",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/evm_opcode_test_ffi.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    opcode_test_lib.root_module.addImport("evm", evm_mod);
    opcode_test_lib.root_module.addImport("primitives", primitives_mod);
    opcode_test_lib.root_module.addImport("crypto", crypto_mod);
    opcode_test_lib.root_module.addImport("build_options", build_options_mod);

    if (bn254_lib) |bn254| {
        opcode_test_lib.linkLibrary(bn254);
        opcode_test_lib.addIncludePath(b.path("src/bn254_wrapper"));
    }

    b.installArtifact(opcode_test_lib);

    // Simplified test configuration - just two test targets
    const lib_unit_tests = b.addTest(.{
        .root_module = lib_mod,
    });
    const run_lib_unit_tests = b.addRunArtifact(lib_unit_tests);

    const integration_tests = b.addTest(.{
        .name = "integration-tests",
        .root_module = b.createModule(.{
            .root_source_file = b.path("test/root.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    
    // Add all necessary imports to integration tests
    integration_tests.root_module.addImport("evm", evm_mod);
    integration_tests.root_module.addImport("primitives", primitives_mod);
    integration_tests.root_module.addImport("crypto", crypto_mod);
    integration_tests.root_module.addImport("build_options", build_options_mod);
    integration_tests.root_module.addImport("zbench", zbench_dep.module("zbench"));
    integration_tests.root_module.addImport("compilers", compilers_mod);
    integration_tests.root_module.addImport("provider", provider_mod);
    integration_tests.root_module.addImport("trie", trie_mod);
    integration_tests.root_module.addImport("Guillotine_lib", lib_mod);
    
    if (revm_lib != null) {
        integration_tests.root_module.addImport("revm", revm_mod);
        integration_tests.linkLibrary(revm_lib.?);
        integration_tests.addIncludePath(b.path("src/revm_wrapper"));
        integration_tests.linkLibC();
        
        const revm_rust_target_dir_test = if (optimize == .Debug) "debug" else "release";
        const revm_dylib_path_test = if (rust_target) |target_triple|
            b.fmt("target/{s}/{s}/librevm_wrapper.dylib", .{ target_triple, revm_rust_target_dir_test })
        else
            b.fmt("target/{s}/librevm_wrapper.dylib", .{revm_rust_target_dir_test});
        integration_tests.addObjectFile(b.path(revm_dylib_path_test));
        
        if (target.result.os.tag == .linux) {
            integration_tests.linkSystemLibrary("m");
            integration_tests.linkSystemLibrary("pthread");
            integration_tests.linkSystemLibrary("dl");
        } else if (target.result.os.tag == .macos) {
            integration_tests.linkSystemLibrary("c++");
            integration_tests.linkFramework("Security");
            integration_tests.linkFramework("SystemConfiguration");
            integration_tests.linkFramework("CoreFoundation");
        }
        
        integration_tests.step.dependOn(&revm_lib.?.step);
    }
    
    if (bn254_lib) |bn254| {
        integration_tests.linkLibrary(bn254);
        integration_tests.addIncludePath(b.path("src/bn254_wrapper"));
    }
    
    integration_tests.linkLibrary(c_kzg_lib);
    integration_tests.linkLibrary(blst_lib);
    
    const run_integration_tests = b.addRunArtifact(integration_tests);
    
    // Main test step that runs both test targets
    const test_step = b.step("test", "Run all tests");
    test_step.dependOn(&run_lib_unit_tests.step);
    test_step.dependOn(&run_integration_tests.step);
    const docs_step = b.step("docs", "Generate and install documentation");
    const docs_install = b.addInstallDirectory(.{
        .source_dir = lib.getEmittedDocs(),
        .install_dir = .prefix,
        .install_subdir = "docs",
    });
    docs_step.dependOn(&docs_install.step);

    const python_build_cmd = b.addSystemCommand(&[_][]const u8{ "python3", "build.py" });
    python_build_cmd.setCwd(b.path("src/guillotine-py"));
    python_build_cmd.step.dependOn(b.getInstallStep());

    const python_build_step = b.step("python", "Build Python bindings");
    python_build_step.dependOn(&python_build_cmd.step);

    const python_dev_cmd = b.addSystemCommand(&[_][]const u8{ "python3", "build.py", "--dev" });
    python_dev_cmd.setCwd(b.path("src/guillotine-py"));
    python_dev_cmd.step.dependOn(b.getInstallStep());

    const python_dev_step = b.step("python-dev", "Build and install Python bindings in development mode");
    python_dev_step.dependOn(&python_dev_cmd.step);

    const python_test_cmd = b.addSystemCommand(&[_][]const u8{ "python3", "-m", "pytest", "tests/", "-v" });
    python_test_cmd.setCwd(b.path("src/guillotine-py"));
    python_test_cmd.step.dependOn(&python_build_cmd.step);

    const python_test_step = b.step("python-test", "Run Python binding tests");
    python_test_step.dependOn(&python_test_cmd.step);

    const python_examples_cmd = b.addSystemCommand(&[_][]const u8{ "python3", "examples.py" });
    python_examples_cmd.setCwd(b.path("src/guillotine-py"));
    python_examples_cmd.step.dependOn(&python_build_cmd.step);

    const python_examples_step = b.step("python-examples", "Run Python binding examples");
    python_examples_step.dependOn(&python_examples_cmd.step);

    addSwiftSteps(b);

    addGoSteps(b);

    addTypeScriptSteps(b);
}

fn addSwiftSteps(b: *std.Build) void {
    const swift_build_cmd = b.addSystemCommand(&[_][]const u8{ "swift", "build" });
    swift_build_cmd.setCwd(b.path("src/guillotine-swift"));
    swift_build_cmd.step.dependOn(b.getInstallStep());

    const swift_build_step = b.step("swift", "Build Swift bindings");
    swift_build_step.dependOn(&swift_build_cmd.step);

    const swift_test_cmd = b.addSystemCommand(&[_][]const u8{ "swift", "test" });
    swift_test_cmd.setCwd(b.path("src/guillotine-swift"));
    swift_test_cmd.step.dependOn(&swift_build_cmd.step);

    const swift_test_step = b.step("swift-test", "Run Swift binding tests");
    swift_test_step.dependOn(&swift_test_cmd.step);

    const swift_validate_cmd = b.addSystemCommand(&[_][]const u8{ "swift", "package", "validate" });
    swift_validate_cmd.setCwd(b.path("src/guillotine-swift"));

    const swift_validate_step = b.step("swift-validate", "Validate Swift package");
    swift_validate_step.dependOn(&swift_validate_cmd.step);
}

fn addGoSteps(b: *std.Build) void {
    const go_mod_tidy_cmd = b.addSystemCommand(&[_][]const u8{ "go", "mod", "tidy" });
    go_mod_tidy_cmd.setCwd(b.path("src/guillotine-go"));
    go_mod_tidy_cmd.step.dependOn(b.getInstallStep());

    const go_build_cmd = b.addSystemCommand(&[_][]const u8{ "go", "build", "./..." });
    go_build_cmd.setCwd(b.path("src/guillotine-go"));
    go_build_cmd.step.dependOn(&go_mod_tidy_cmd.step);

    const go_build_step = b.step("go", "Build Go bindings");
    go_build_step.dependOn(&go_build_cmd.step);

    const go_test_cmd = b.addSystemCommand(&[_][]const u8{ "go", "test", "./..." });
    go_test_cmd.setCwd(b.path("src/guillotine-go"));
    go_test_cmd.step.dependOn(&go_build_cmd.step);

    const go_test_step = b.step("go-test", "Run Go binding tests");
    go_test_step.dependOn(&go_test_cmd.step);

    const go_vet_cmd = b.addSystemCommand(&[_][]const u8{ "go", "vet", "./..." });
    go_vet_cmd.setCwd(b.path("src/guillotine-go"));
    go_vet_cmd.step.dependOn(&go_build_cmd.step);

    const go_vet_step = b.step("go-vet", "Run Go code analysis");
    go_vet_step.dependOn(&go_vet_cmd.step);

    const go_fmt_check_cmd = b.addSystemCommand(&[_][]const u8{ "sh", "-c", "test -z \"$(gofmt -l .)\" || (echo 'Code is not formatted. Run: go fmt ./...' && exit 1)" });
    go_fmt_check_cmd.setCwd(b.path("src/guillotine-go"));

    const go_fmt_check_step = b.step("go-fmt-check", "Check Go code formatting");
    go_fmt_check_step.dependOn(&go_fmt_check_cmd.step);

    const go_fmt_cmd = b.addSystemCommand(&[_][]const u8{ "go", "fmt", "./..." });
    go_fmt_cmd.setCwd(b.path("src/guillotine-go"));

    const go_fmt_step = b.step("go-fmt", "Format Go code");
    go_fmt_step.dependOn(&go_fmt_cmd.step);
}

fn addTypeScriptSteps(b: *std.Build) void {
    const ts_install_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "install" });
    ts_install_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_install_cmd.step.dependOn(b.getInstallStep());

    const ts_copy_wasm_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "copy-wasm" });
    ts_copy_wasm_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_copy_wasm_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_build_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "build" });
    ts_build_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_build_cmd.step.dependOn(&ts_copy_wasm_cmd.step);

    const ts_build_step = b.step("ts", "Build TypeScript bindings");
    ts_build_step.dependOn(&ts_build_cmd.step);

    const ts_test_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "test" });
    ts_test_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_test_cmd.step.dependOn(&ts_build_cmd.step);

    const ts_test_step = b.step("ts-test", "Run TypeScript binding tests");
    ts_test_step.dependOn(&ts_test_cmd.step);

    const ts_lint_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "lint" });
    ts_lint_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_lint_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_lint_step = b.step("ts-lint", "Run TypeScript linting");
    ts_lint_step.dependOn(&ts_lint_cmd.step);

    const ts_format_check_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "format:check" });
    ts_format_check_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_format_check_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_format_check_step = b.step("ts-format-check", "Check TypeScript code formatting");
    ts_format_check_step.dependOn(&ts_format_check_cmd.step);

    const ts_format_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "format" });
    ts_format_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_format_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_format_step = b.step("ts-format", "Format TypeScript code");
    ts_format_step.dependOn(&ts_format_cmd.step);

    const ts_typecheck_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "typecheck" });
    ts_typecheck_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_typecheck_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_typecheck_step = b.step("ts-typecheck", "Run TypeScript type checking");
    ts_typecheck_step.dependOn(&ts_typecheck_cmd.step);

    const ts_dev_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "dev" });
    ts_dev_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_dev_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_dev_step = b.step("ts-dev", "Run TypeScript in development/watch mode");
    ts_dev_step.dependOn(&ts_dev_cmd.step);

    const ts_clean_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "clean" });
    ts_clean_cmd.setCwd(b.path("src/guillotine-ts"));

    const ts_clean_step = b.step("ts-clean", "Clean TypeScript build artifacts");
    ts_clean_step.dependOn(&ts_clean_cmd.step);
}
