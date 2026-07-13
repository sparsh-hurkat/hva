import { Link } from "react-router-dom";
import { Anchor, Card, Group, Stack, Text, Title } from "@mantine/core";
import { ChevronRight, ExternalLink, Layers, ListChecks } from "lucide-react";
import { useScanSummary } from "../hooks";
import { adoWorkItemUrl, emptyCounts, totalCount } from "../api";
import { AiSummaryStrip } from "../components/AiSummaryStrip";
import { ErrorState } from "../components/ErrorState";
import { IssueCountBadge } from "../components/IssueCountBadge";
import { Loading } from "../components/Loading";
import { SEVERITY_ICONS } from "../components/severityVisuals";
import { StartScanButton } from "../components/StartScanButton";
import { StatTiles, type StatTileData } from "../components/StatTiles";

export function ReleaseItemListPage() {
  const { data: summary, isLoading, isError, error } = useScanSummary();

  const aggregate = summary?.releaseItems.reduce((acc, item) => {
    acc.critical += item.totalCounts.critical;
    acc.high += item.totalCounts.high;
    acc.medium += item.totalCounts.medium;
    acc.low += item.totalCounts.low;
    acc.info += item.totalCounts.info;
    return acc;
  }, emptyCounts());

  const tiles: StatTileData[] = summary
    ? [
        { label: "Release items", value: summary.releaseItems.length, icon: Layers, color: "blue" },
        { label: "Critical issues", value: aggregate!.critical, icon: SEVERITY_ICONS.CRITICAL, color: "red" },
        { label: "High issues", value: aggregate!.high, icon: SEVERITY_ICONS.HIGH, color: "orange" },
        { label: "Total issues", value: totalCount(aggregate!), icon: ListChecks, color: "gray" },
      ]
    : [];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <div>
          <Title order={1}>Release security scan results</Title>
          <Text c="dimmed" size="sm" mt={2}>
            Review results from the last run, or start a new scan.
          </Text>
        </div>
        <StartScanButton />
      </Group>

      {isLoading && <Loading label="Loading release items..." />}
      {isError && <ErrorState message={error.message} />}

      {summary && (
        <>
          <StatTiles tiles={tiles} />

          <Stack gap="xs">
            {summary.releaseItems.map((item) => (
              <Card
                key={item.workItemId}
                component={Link}
                to={`/release-items/${item.workItemId}`}
                withBorder
                radius="md"
                padding="sm"
                style={{ textDecoration: "none" }}
              >
                <Stack gap={6}>
                  <Group justify="space-between" wrap="nowrap" gap="lg">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group gap={4} wrap="nowrap">
                        <Text fw={700} size="sm" truncate>
                          {item.applicationName}
                        </Text>
                        <Anchor
                          href={adoWorkItemUrl(item.workItemId)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open release work item in ADO"
                          display="inline-flex"
                          style={{ flexShrink: 0 }}
                        >
                          <ExternalLink size={12} />
                        </Anchor>
                      </Group>
                      {item.releaseDate && (
                        <Text size="xs" c="dimmed">
                          {new Date(item.releaseDate).toLocaleDateString()}
                        </Text>
                      )}
                    </div>

                    <IssueCountBadge totalCounts={item.totalCounts} toolCounts={item.toolCounts} />

                    <ChevronRight size={16} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
                  </Group>

                  <AiSummaryStrip summary={item.aiSummary} />
                </Stack>
              </Card>
            ))}
            {summary.releaseItems.length === 0 && (
              <Text c="dimmed">No release work items found for the current run.</Text>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
}
