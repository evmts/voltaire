import Foundation
import Voltaire

struct Metric {
    let name: String
    let meanNs: Double
    let minNs: Double
    let maxNs: Double
    let samples: Int
}

@inline(never)
func blackHole<T>(_ value: T) {
    withUnsafePointer(to: value) { _ in }
}

func measure(_ name: String, samples: Int = 15, _ block: () throws -> Void) rethrows -> Metric {
    for _ in 0..<100 { try block() }
    let calStart = DispatchTime.now().uptimeNanoseconds
    var cal = 0
    while (DispatchTime.now().uptimeNanoseconds - calStart) < 2_000_000 && cal < 100_000 {
        try block()
        cal += 1
    }
    let batch = max(1, cal / 2)
    var results: [Double] = []
    results.reserveCapacity(samples)
    for _ in 0..<samples {
        let t0 = DispatchTime.now().uptimeNanoseconds
        for _ in 0..<batch {
            try block()
        }
        let elapsed = Double(DispatchTime.now().uptimeNanoseconds - t0) / Double(batch)
        results.append(elapsed)
    }
    let mean = results.reduce(0, +) / Double(samples)
    return Metric(
        name: name,
        meanNs: mean,
        minNs: results.min() ?? mean,
        maxNs: results.max() ?? mean,
        samples: samples
    )
}

func runModule(_ module: String) throws -> [Metric] {
    var metrics: [Metric] = []
    let all = module == "all"

    if all || module == "address" {
        let hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
        let addr = try Address(hex: hex)
        metrics.append(try measure("Address.init(hex:)") { blackHole(try Address(hex: hex)) })
        metrics.append(measure("Address.hex") { blackHole(addr.hex) })
        metrics.append(measure("Address.checksumHex") { blackHole(addr.checksumHex) })
    }
    if all || module == "hex" {
        let bytes32 = [UInt8](repeating: 0xAB, count: 32)
        let bytes1k = [UInt8](repeating: 0xAB, count: 1024)
        let hex32 = Hex.encode(bytes32)
        let hex1k = Hex.encode(bytes1k)
        metrics.append(measure("Hex.encode_32b") { blackHole(Hex.encode(bytes32)) })
        metrics.append(measure("Hex.encode_1kb") { blackHole(Hex.encode(bytes1k)) })
        metrics.append(try measure("Hex.decode_32b") { blackHole(try Hex.decode(hex32)) })
        metrics.append(try measure("Hex.decode_1kb") { blackHole(try Hex.decode(hex1k)) })
    }
    if all || module == "hash" {
        let hhex = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        let h = try Hash(hex: hhex)
        metrics.append(try measure("Hash.init(hex:)") { blackHole(try Hash(hex: hhex)) })
        metrics.append(measure("Hash.hex") { blackHole(h.hex) })
    }
    if all || module == "bytes32" {
        let bhex = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        let b = try Bytes32(hex: bhex)
        metrics.append(try measure("Bytes32.init(hex:)") { blackHole(try Bytes32(hex: bhex)) })
        metrics.append(measure("Bytes32.hex") { blackHole(b.hex) })
    }
    if all || module == "u256" {
        let uhex = "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"
        let u = try U256(hex: uhex)
        metrics.append(try measure("U256.init(hex:)") { blackHole(try U256(hex: uhex)) })
        metrics.append(measure("U256.hex") { blackHole(u.hex) })
    }
    if all || module == "keccak256" {
        let d32 = Data(repeating: 0x42, count: 32)
        let d1k = Data(repeating: 0x42, count: 1024)
        metrics.append(measure("Keccak256.hash_32b") { blackHole(Keccak256.hash(d32)) })
        metrics.append(measure("Keccak256.hash_1kb") { blackHole(Keccak256.hash(d1k)) })
    }
    return metrics
}

let moduleArg = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "all"
let metrics = try runModule(moduleArg)
let items = metrics.map { m -> String in
    let ops = m.meanNs > 0 ? Int((1_000_000_000.0 / m.meanNs).rounded()) : 0
    return String(
        format: "{\"name\":\"%@\",\"unit\":\"ns/op\",\"value\":%.3f,\"lowerIsBetter\":true,\"meanNs\":%.3f,\"minNs\":%.3f,\"maxNs\":%.3f,\"opsPerSec\":%d,\"samples\":%d}",
        m.name, m.meanNs, m.meanNs, m.minNs, m.maxNs, ops, m.samples
    )
}.joined(separator: ",")

print("SMTHRS_BENCH_JSON:{\"suite\":\"voltaire-swift:\(moduleArg)\",\"runtime\":\"swift\",\"metrics\":[\(items)]}")
