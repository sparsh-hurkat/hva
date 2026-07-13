import { useScanRunStatus, useStartScan } from "../hooks";

/** The button that kicks off the whole ADO -> scan process, plus its in-progress status. */
export function StartScanButton() {
  const { data: runStatus } = useScanRunStatus();
  const startScan = useStartScan();
  const isRunning = runStatus?.status === "IN_PROGRESS";

  return (
    <div className="start-scan">
      <button
        className="start-scan-button"
        onClick={() => startScan.mutate()}
        disabled={isRunning || startScan.isPending}
      >
        {isRunning ? "Scan in progress..." : "Start scan"}
      </button>
      {isRunning && <p className="start-scan-step">{runStatus.currentStep}</p>}
      {runStatus?.status === "FAILED" && <p className="start-scan-error">Last run failed: {runStatus.error}</p>}
      {startScan.isError && <p className="start-scan-error">Could not start scan: {startScan.error.message}</p>}
    </div>
  );
}
