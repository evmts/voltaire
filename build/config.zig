const std = @import("std");

pub const BuildOptions = struct {
    no_precompiles: bool,
    force_bn254: bool,
    no_bn254: bool,
    enable_tracing: bool,
    disable_tailcall_dispatch: bool,
};

pub fn createBuildOptions(b: *std.Build, target: std.Build.ResolvedTarget) struct {
    options: BuildOptions,
    options_mod: *std.Build.Module,
} {
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

    return .{
        .options = BuildOptions{
            .no_precompiles = no_precompiles,
            .force_bn254 = force_bn254,
            .no_bn254 = no_bn254,
            .enable_tracing = enable_tracing,
            .disable_tailcall_dispatch = disable_tailcall_dispatch,
        },
        .options_mod = build_options.createModule(),
    };
}

pub fn getRustTarget(target: std.Build.ResolvedTarget) ?[]const u8 {
    return switch (target.result.os.tag) {
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
}