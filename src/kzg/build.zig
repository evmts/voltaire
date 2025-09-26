const std = @import("std");

pub fn ensureTrustedSetup(b: *std.Build) void {
    // Download KZG trusted setup if it doesn't exist
    const kzg_path = "src/kzg/trusted_setup.txt";
    std.fs.cwd().access(kzg_path, .{}) catch {
        const download_kzg = b.addSystemCommand(&[_][]const u8{
            "curl",
            "-L",
            "-o",
            kzg_path,
            "https://github.com/ethereum/c-kzg-4844/raw/main/src/trusted_setup.txt",
        });
        b.getInstallStep().dependOn(&download_kzg.step);
    };
}