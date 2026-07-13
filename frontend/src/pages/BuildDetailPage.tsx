import { useParams } from "react-router-dom";
import { Anchor, Group, Stack, Text, Title } from "@mantine/core";
import { ExternalLink } from "lucide-react";
import { useBuildDetail } from "../hooks";
import { AiSummaryCard } from "../components/AiSummaryCard";
import { ErrorState } from "../components/ErrorState";
import { IssueTable } from "../components/IssueTable";
import { Loading } from "../components/Loading";
import { PageBreadcrumbs } from "../components/PageBreadcrumbs";

export function BuildDetailPage() {
  const { workItemId, buildId } = useParams<{ workItemId: string; buildId: string }>();
  const parsedWorkItemId = Number(workItemId);
  const parsedBuildId = Number(buildId);
  const { data: build, isLoading, isError, error } = useBuildDetail(parsedWorkItemId, parsedBuildId);

  const repositories = build?.repositories ?? [];

  return (
    <Stack gap="lg">
      <PageBreadcrumbs
        crumbs={[
          { label: "Release items", to: "/" },
          { label: `Release item ${workItemId}`, to: `/release-items/${workItemId}` },
          { label: `Build ${buildId}` },
        ]}
      />

      {isLoading && <Loading label="Loading build details..." />}
      {isError && <ErrorState message={error.message} />}

      {build && (
        <>
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Group gap="sm" wrap="wrap" align="baseline">
              <Title order={1} size="h2">
                Build {build.buildId}
              </Title>
              <Text size="xs" c="dimmed" ff="monospace">
                {build.sourceBranch} · {repositories.map((r) => r.repoName).join(", ") || "no repositories"}
              </Text>
            </Group>
            <Anchor
              href={build.pipelineUrl}
              target="_blank"
              rel="noreferrer"
              size="sm"
              display="inline-flex"
              style={{ alignItems: "center", gap: 4, flexShrink: 0 }}
            >
              View pipeline run <ExternalLink size={14} />
            </Anchor>
          </Group>

          <AiSummaryCard summary={build.aiSummary} />

          <div>
            <Text fw={600} c="dimmed" size="sm" mb="sm">
              Issues
            </Text>
            <IssueTable
              workItemId={parsedWorkItemId}
              buildId={parsedBuildId}
              showRepoColumn={repositories.length > 1}
            />
          </div>
        </>
      )}
    </Stack>
  );
}
