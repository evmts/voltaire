// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "GuillotineEVM",
    platforms: [
        .macOS(.v12),
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "GuillotineEVM",
            targets: ["GuillotineEVM"]),
    ],
    targets: [
        .target(
            name: "GuillotineFFI",
            path: "Sources/GuillotineFFI",
            publicHeadersPath: "include",
            linkerSettings: [
                .unsafeFlags(["-L../../zig-out/lib"]),
                .linkedLibrary("guillotine_ffi")
            ]
        ),
        .target(
            name: "GuillotineEVM",
            dependencies: ["GuillotineFFI"],
            path: "Sources/GuillotineEVM"
        ),
        .testTarget(
            name: "GuillotineEVMTests",
            dependencies: ["GuillotineEVM"],
            path: "Tests/GuillotineEVMTests"
        ),
    ]
)
