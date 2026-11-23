// swift-tools-version:5.9
// Separate package so `swift test` in the parent never links this executable:
// linking an executable target into the macOS 12 test bundle fails on the
// back-deployed Swift concurrency runtime (libswiftCompatibility56).
import PackageDescription

let package = Package(
    name: "VoltaireBenchmarks",
    platforms: [
        .macOS(.v12),
        .iOS(.v15),
    ],
    dependencies: [
        .package(name: "Voltaire", path: ".."),
    ],
    targets: [
        .executableTarget(
            name: "VoltaireBenchmarks",
            dependencies: [.product(name: "Voltaire", package: "Voltaire")],
            path: "Sources/VoltaireBenchmarks"
        ),
    ]
)
