// swift-tools-version:5.9
import PackageDescription
import Foundation

// Resolve paths relative to package
let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
let zigOutNative = "\(packageDir)/../../zig-out/native"

let package = Package(
    name: "Voltaire",
    platforms: [
        .macOS(.v12),
        .iOS(.v15),
    ],
    products: [
        .library(
            name: "Voltaire",
            targets: ["Voltaire"]
        ),
    ],
    targets: [
        // C header module (implementation from Zig dylib)
        .target(
            name: "CVoltaire",
            dependencies: [],
            path: "Sources/CVoltaire",
            sources: ["empty.c"],
            publicHeadersPath: "include",
            linkerSettings: [
                .unsafeFlags(["-L\(zigOutNative)", "-lprimitives_ts_native"]),
                .unsafeFlags(["-Xlinker", "-rpath", "-Xlinker", zigOutNative]),
            ]
        ),
        // Swift wrappers
        .target(
            name: "Voltaire",
            dependencies: ["CVoltaire"],
            path: "Sources/Voltaire"
        ),
        .testTarget(
            name: "VoltaireTests",
            dependencies: ["Voltaire"],
            path: "Tests/VoltaireTests"
        ),
    ]
)
