/**
 * Shared lightweight benchmark harness for Voltaire TypeScript/Effect suites.
 *
 * Uses calibrated batches with high-resolution nanosecond timing, prints a
 * concise human table, and emits `SMTHRS_BENCH_JSON:` for Smithers `Bench`
 * targets (caching, summaries, and `--compare` delta tables).
 */
export interface BenchMetric {
    name: string;
    unit: "ns/op";
    value: number;
    lowerIsBetter: true;
    meanNs: number;
    medianNs: number;
    minNs: number;
    maxNs: number;
    p75Ns: number;
    p99Ns: number;
    opsPerSec: number;
    samples: number;
}
export interface BenchCase {
    name: string;
    fn: () => unknown;
}
export declare function runBenchSuite(suite: string, cases: readonly BenchCase[], options?: {
    samples?: number;
    sampleTargetMs?: number;
}): Promise<BenchMetric[]>;
//# sourceMappingURL=bench-harness.d.ts.map