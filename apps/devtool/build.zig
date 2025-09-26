const std = @import("std");

// Export the asset generator for use in this build config
pub const AssetGenerator = @import("asset_generator.build.zig");

pub fn createDevtoolExecutable(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    lib_mod: *std.Build.Module,
    evm_mod: *std.Build.Module,
    primitives_mod: *std.Build.Module,
    provider_mod: *std.Build.Module,
    generate_assets_step: *std.Build.Step,
) *std.Build.Step.Compile {
    // Create devtool module
    const devtool_mod = b.createModule(.{
        .root_source_file = b.path("apps/devtool/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    devtool_mod.addImport("Guillotine_lib", lib_mod);
    devtool_mod.addImport("evm", evm_mod);
    devtool_mod.addImport("primitives", primitives_mod);
    devtool_mod.addImport("provider", provider_mod);

    // Create executable
    const devtool_exe = b.addExecutable(.{
        .name = "guillotine-devtool",
        .root_module = devtool_mod,
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });

    // Platform-specific setup
    setupPlatformSpecific(b, target, devtool_exe);

    // Link external libraries
    devtool_exe.linkLibC();
    if (target.result.os.tag == .macos) {
        devtool_exe.linkFramework("WebKit");
        devtool_exe.linkFramework("AppKit");
        devtool_exe.linkFramework("Foundation");
    }

    // Make devtool build depend on asset generation
    devtool_exe.step.dependOn(generate_assets_step);

    return devtool_exe;
}

pub fn createDevtoolSteps(b: *std.Build, devtool_exe: *std.Build.Step.Compile, target: std.Build.ResolvedTarget) void {
    // Create run command
    const run_devtool_cmd = b.addRunArtifact(devtool_exe);
    run_devtool_cmd.step.dependOn(b.getInstallStep());

    const devtool_run_step = b.step("devtool", "Build and run the Ethereum devtool");
    devtool_run_step.dependOn(&run_devtool_cmd.step);

    const devtool_build_step = b.step("build-devtool", "Build the Ethereum devtool (without running)");
    devtool_build_step.dependOn(&b.addInstallArtifact(devtool_exe, .{}).step);

    // Create macOS app bundle if on macOS
    if (target.result.os.tag == .macos) {
        createMacOSAppBundle(b, devtool_exe);
    }
}

fn setupPlatformSpecific(b: *std.Build, target: std.Build.ResolvedTarget, exe: *std.Build.Step.Compile) void {
    // Add native menu implementation on macOS
    if (target.result.os.tag == .macos) {
        // Compile Swift native menu
        const swift_compile = b.addSystemCommand(&[_][]const u8{
            "swiftc",
            "-emit-library",
            "-emit-module",
            "-static",
            "-whole-module-optimization",
            "-O",
            "-target", "arm64-apple-macosx15.0",
            "-o", "zig-out/libnative_menu_swift.dylib",
            "apps/devtool/native_menu.swift",
        });

        // Ensure output directory exists
        const mkdir_cmd = b.addSystemCommand(&[_][]const u8{
            "mkdir", "-p", "zig-out"
        });
        swift_compile.step.dependOn(&mkdir_cmd.step);

        // Link the compiled Swift dynamic library
        exe.addLibraryPath(b.path("zig-out"));
        exe.linkSystemLibrary("native_menu_swift");
        exe.step.dependOn(&swift_compile.step);

        // Add Swift runtime library search paths
        exe.addLibraryPath(.{ .cwd_relative = "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/macosx" });
        exe.addLibraryPath(.{ .cwd_relative = "/usr/lib/swift" });
    }
}

fn createMacOSAppBundle(b: *std.Build, exe: *std.Build.Step.Compile) void {
    const bundle_dir = "zig-out/Guillotine DevTool.app/Contents/MacOS";

    // Create app bundle structure
    const mkdir_bundle = b.addSystemCommand(&[_][]const u8{
        "mkdir", "-p", bundle_dir,
    });

    // Copy executable to app bundle
    const copy_to_bundle = b.addSystemCommand(&[_][]const u8{
        "cp", "-f", "zig-out/bin/guillotine-devtool", bundle_dir,
    });
    copy_to_bundle.step.dependOn(&exe.step);
    copy_to_bundle.step.dependOn(&mkdir_bundle.step);

    // Create Info.plist
    const info_plist_content =
        \\<?xml version="1.0" encoding="UTF-8"?>
        \\<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
        \\<plist version="1.0">
        \\<dict>
        \\    <key>CFBundleExecutable</key>
        \\    <string>guillotine-devtool</string>
        \\    <key>CFBundleIdentifier</key>
        \\    <string>com.guillotine.devtool</string>
        \\    <key>CFBundleName</key>
        \\    <string>Guillotine DevTool</string>
        \\    <key>CFBundlePackageType</key>
        \\    <string>APPL</string>
        \\    <key>CFBundleShortVersionString</key>
        \\    <string>1.0</string>
        \\    <key>CFBundleVersion</key>
        \\    <string>1</string>
        \\    <key>LSMinimumSystemVersion</key>
        \\    <string>15.0</string>
        \\    <key>NSHighResolutionCapable</key>
        \\    <true/>
        \\</dict>
        \\</plist>
    ;

    const write_plist = b.addWriteFile("Guillotine DevTool.app/Contents/Info.plist", info_plist_content);
    copy_to_bundle.step.dependOn(&write_plist.step);

    const app_bundle_step = b.step("macos-app", "Create macOS app bundle");
    app_bundle_step.dependOn(&copy_to_bundle.step);
}