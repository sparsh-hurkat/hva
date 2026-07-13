import { Button, Stack, Text } from "@mantine/core";
import { Play } from "lucide-react";
import { useScanRunStatus, useStartScan } from "../hooks";

/** The button that kicks off the whole ADO -> scan process, plus its in-progress status. */
export function StartScanButton() {
  const { data: runStatus } = useScanRunStatus();
  const startScan = useStartScan();
  const isRunning = runStatus?.status === "IN_PROGRESS";

  return (
    <Stack gap={6} align="flex-start">
      <Button
        leftSection={<Play size={16} />}
        loading={isRunning || startScan.isPending}
        onClick={() => startScan.mutate()}
      >
        {isRunning ? "Scan in progress..." : "Start scan"}
      </Button>
      {isRunning && (
        <Text size="sm" c="dimmed">
          {runStatus.currentStep}
        </Text>
      )}
      {runStatus?.status === "FAILED" && (
        <Text size="sm" c="red">
          Last run failed: {runStatus.error}
        </Text>
      )}
      {startScan.isError && (
        <Text size="sm" c="red">
          Could not start scan: {startScan.error.message}
        </Text>
      )}
    </Stack>
  );
}
