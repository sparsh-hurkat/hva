import { Link, useParams } from "react-router-dom";
import { Anchor, Card, Group, Stack, Text, Title } from "@mantine/core";
import { ChevronRight, ExternalLink } from "lucide-react";
import { useReleaseItemDetail } from "../hooks";
import { adoWorkItemUrl } from "../api";
import { AiSummaryCard } from "../components/AiSummaryCard";
import { AiSummaryStrip } from "../components/AiSummaryStrip";
import { ErrorState } from "../components/ErrorState";
import { IssueCountBadge } from "../components/IssueCountBadge";
import { Loading } from "../components/Loading";
import { PageBreadcrumbs } from "../components/PageBreadcrumbs";

export function ReleaseItemDetailPage() {
  const { workItemId } = useParams<{ workItemId: string }>();
  const parsedId = Number(workItemId);
  const { data: item, isLoading, isError, error } = useReleaseItemDetail(parsedId);

  return (
    <Stack gap="lg">
      <PageBreadcrumbs
        crumbs={
          item
            ? [{ label: "Release items", to: "/" }, { label: item.applicationName }]
            : [{ label: "Release items", to: "/" }]
        }
      />

      {isLoading && <Loading label="Loading release item..." />}
      {isError && <ErrorState message={error.message} />}

      {item && (
        <>
          <Group justify="space-between" wrap="wrap">
            <Group gap={6}>
              <Title order={1}>{item.applicationName}</Title>
              <Anchor
                href={adoWorkItemUrl(item.workItemId)}
                target="_blank"
                rel="noreferrer"
                title="Open release work item in ADO"
                display="inline-flex"
              >
                <ExternalLink size={16} />
              </Anchor>
            </Group>
            {item.releaseDate && (
              <Text c="dimmed" size="sm">
                Release date: {new Date(item.releaseDate).toLocaleDateString()}
              </Text>
            )}
          </Group>

          <AiSummaryCard summary={item.aiSummary} />

          <div>
            <Text fw={600} c="dimmed" size="sm" mb="sm">
              Builds in this release
            </Text>
            <Stack gap="xs">
              {item.builds.map((build) => (
                <Card
                  key={build.buildId}
                  component={Link}
                  to={`/release-items/${item.workItemId}/builds/${build.buildId}`}
                  withBorder
                  radius="md"
                  padding="sm"
                  style={{ textDecoration: "none" }}
                >
                  <Stack gap={6}>
                    <Group justify="space-between" wrap="nowrap" gap="lg">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={700} size="sm">
                          Build {build.buildId}
                        </Text>
                        <Text ff="monospace" size="xs" c="dimmed" truncate>
                          {build.sourceBranch}
                        </Text>
                      </div>
                      <IssueCountBadge totalCounts={build.totalCounts} toolCounts={build.toolCounts} />
                      <ChevronRight size={16} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
                    </Group>
                    <AiSummaryStrip summary={build.aiSummary} />
                  </Stack>
                </Card>
              ))}
              {item.builds.length === 0 && <Text c="dimmed">No builds found for this release item.</Text>}
            </Stack>
          </div>
        </>
      )}
    </Stack>
  );
}
