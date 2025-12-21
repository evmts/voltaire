/**
 * Task: Fix TypeScript Errors
 */

import type { TaskConfig, SessionState } from "../index.ts";

async function runCommand(cmd: string): Promise<string> {
  const proc = Bun.spawn(["sh", "-c", cmd], {
    stdout: "pipe",
    stderr: "pipe",
  });
  await proc.exited;
  return new Response(proc.stdout).text();
}

const config: TaskConfig = {
  id: "fix-typescript-errors",
  name: "Fix TypeScript Errors",
  reportsDir: "reports/typescript-fixes",
  maxBudgetPerCycle: 2.0,
  targetValue: 0,

  async checkState() {
    try {
      const result = await runCommand(
        'bun run tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"'
      );
      const count = parseInt(result.trim()) || 0;
      return {
        value: count,
        status: count === 0 ? "No errors" : `${count} errors`,
      };
    } catch {
      return { value: 0, status: "Check failed" };
    }
  },

  generatePrompt(state: SessionState) {
    return `<handoff>
  <metadata>
    <task>Fix TypeScript Errors</task>
    <repository>voltaire</repository>
    <working_directory>/Users/williamcory/voltaire</working_directory>
    <date>${new Date().toISOString().split("T")[0]}</date>
    <cycle>${state.totalCycles + 1}</cycle>
  </metadata>

  <progress>
    <initial_errors>${state.initialValue}</initial_errors>
    <current_errors>${state.currentValue}</current_errors>
    <reduction>${state.totalPercentReduction.toFixed(1)}%</reduction>
  </progress>

  <commands>
    <check>bun run tsc --noEmit 2>&amp;1 | grep -c "error TS"</check>
    <list>bun run tsc --noEmit 2>&amp;1 | grep "error TS"</list>
    <by_file>bun run tsc --noEmit 2>&amp;1 | grep -E "\\.js\\([0-9]+,[0-9]+\\)|\\.ts\\([0-9]+,[0-9]+\\)" | sed 's/([0-9]*,[0-9]*).*//' | sort | uniq -c | sort -rn | head -30</by_file>
  </commands>

  <patterns>
    <pattern name="array_access">const item = /** @type {*} */ (arr[0]);</pattern>
    <pattern name="branded_cast">return /** @type {Type} */ (/** @type {unknown} */ (value));</pattern>
    <pattern name="readonly_spread">result = { ...result, prop: value };</pattern>
    <pattern name="param_type">/** @param {string} a */ function foo(a) {}</pattern>
    <pattern name="record_type">/** @type {Record&lt;string, T&gt;} */ const obj = {};</pattern>
  </patterns>

  <anti_patterns>
    <bad>arr[0]! // Does NOT work in .js files</bad>
    <bad>@ts-ignore // Fix the type instead</bad>
  </anti_patterns>

  <instructions>
    1. Check error count and get top error files
    2. Fix files systematically using patterns above
    3. Commit every 20-40 errors fixed
    4. Target: 0 errors
  </instructions>
</handoff>

Fix TypeScript errors. Start by checking current count and top error files, then fix systematically. Commit progress regularly.`;
  },
};

export default config;
