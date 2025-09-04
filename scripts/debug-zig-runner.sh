#!/bin/bash

set -Eeuo pipefail

if [[ "${TRACE:-}" == "1" ]]; then
  set -x
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "${SCRIPT_DIR}/.." && pwd)
LOG_DIR="${ROOT_DIR}/bench/official"
LOG_FILE="${LOG_DIR}/debug-zig-runner.log"
CASES_DIR="${ROOT_DIR}/bench/official/cases"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(timestamp)] $*" | tee -a "${LOG_FILE}"; }

trap 'log "ERROR: Command failed (exit=$?) at line ${LINENO}: ${BASH_COMMAND}"' ERR

mkdir -p "${LOG_DIR}"
echo > "${LOG_FILE}"

log "Starting debug-zig-runner.sh"
log "ROOT_DIR=${ROOT_DIR}"

# Environment diagnostics
log "System: $(uname -a)"
if command -v zig >/dev/null 2>&1; then log "zig: $(zig version)"; else log "zig: NOT FOUND"; fi

# Git diagnostics (best-effort)
if command -v git >/dev/null 2>&1 && git -C "${ROOT_DIR}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_BRANCH=$(git -C "${ROOT_DIR}" rev-parse --abbrev-ref HEAD || echo "unknown")
  GIT_COMMIT=$(git -C "${ROOT_DIR}" rev-parse --short HEAD || echo "unknown")
  GIT_STATUS=$(git -C "${ROOT_DIR}" status --porcelain || true)
  log "git: branch=${GIT_BRANCH} commit=${GIT_COMMIT} dirty=$([[ -n "${GIT_STATUS}" ]] && echo yes || echo no)"
fi

log "Building Zig runner in Debug mode"
cd "${ROOT_DIR}"
time zig build build-evm-runner -Doptimize=Debug 2>&1 | tee -a "${LOG_FILE}"

ZIG_RUNNER="${ROOT_DIR}/zig-out/bin/evm-runner"
if [[ ! -x "${ZIG_RUNNER}" ]]; then
  log "ERROR: Zig runner binary not found: ${ZIG_RUNNER}"
  exit 1
fi

log "Running Zig runner in verbose mode for each benchmark case"
log "======================================================="

# Process each benchmark case
for CASE_DIR in "${CASES_DIR}"/*; do
  if [[ ! -d "${CASE_DIR}" ]]; then
    continue
  fi
  
  CASE_NAME=$(basename "${CASE_DIR}")
  BYTECODE_FILE="${CASE_DIR}/bytecode.txt"
  CALLDATA_FILE="${CASE_DIR}/calldata.txt"
  OUTPUT_FILE="${CASE_DIR}/output.txt"
  GAS_FILE="${CASE_DIR}/gas.txt"
  
  # Check if required files exist
  if [[ ! -f "${BYTECODE_FILE}" ]] || [[ ! -f "${CALLDATA_FILE}" ]]; then
    log "⚠️  Skipping ${CASE_NAME}: missing required files"
    continue
  fi
  
  log ""
  log "🔍 Running case: ${CASE_NAME}"
  log "----------------------------------------"
  
  # Read calldata and optional expected values
  CALLDATA=$(cat "${CALLDATA_FILE}" | tr -d '\n\r ')
  
  # Build command with optional parameters
  CMD=("${ZIG_RUNNER}")
  CMD+=("--contract-code-path" "${BYTECODE_FILE}")
  CMD+=("--calldata" "${CALLDATA}")
  CMD+=("--num-runs" "1")
  CMD+=("--verbose")  # Always verbose for debugging
  
  if [[ -f "${OUTPUT_FILE}" ]]; then
    EXPECTED_OUTPUT=$(cat "${OUTPUT_FILE}" | tr -d '\n\r ')
    CMD+=("--expected-output" "${EXPECTED_OUTPUT}")
    log "  Expected output: ${EXPECTED_OUTPUT}"
  fi
  
  if [[ -f "${GAS_FILE}" ]]; then
    MIN_GAS=$(cat "${GAS_FILE}" | tr -d '\n\r ')
    CMD+=("--min-gas" "${MIN_GAS}")
    log "  Minimum gas: ${MIN_GAS}"
  fi
  
  # Run the test case with full output
  log "  Command: ${CMD[@]}"
  log ""
  
  set +e  # Don't exit on error for individual test runs
  "${CMD[@]}" 2>&1 | tee -a "${LOG_FILE}"
  RESULT=$?
  set -e
  
  if [[ ${RESULT} -eq 0 ]]; then
    log "✅ ${CASE_NAME}: SUCCESS"
  else
    log "❌ ${CASE_NAME}: FAILED (exit code: ${RESULT})"
  fi
  
  log "----------------------------------------"
done

log ""
log "======================================================="
log "Debug run completed. Full log saved to: ${LOG_FILE}"