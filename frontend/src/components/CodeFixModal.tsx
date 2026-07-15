import { useMemo, useState } from "react";
import { Badge, Button, Group, Modal, Paper, Stack, Text } from "@mantine/core";
import { Check, GitPullRequest } from "lucide-react";
import type { ScanIssue } from "../api";

interface DiffLine {
  lineNumber: number;
  type: "context" | "removed" | "added";
  content: string;
}

interface FixFile {
  repoName: string;
  filePath: string;
  lines: DiffLine[];
}

interface CodeFix {
  summary: string;
  files: FixFile[];
}

// Demo fix data for a handful of issues, keyed by issue id - illustrates what a real
// "suggested fix" response might look like (e.g. from the scanner tool or a follow-up
// code-generation step). Not every issue has one; IssueTable falls back to the plain
// fixDetails tooltip when no diff is available here.
const MOCK_CODE_FIXES: Record<string, CodeFix> = {
  "MEND-9911": {
    summary: "Bump logging-lib to the patched 2.17.1 release.",
    files: [
      {
        repoName: "ratings-portal-api",
        filePath: "pom.xml",
        lines: [
          { lineNumber: 41, type: "context", content: "  <dependency>" },
          { lineNumber: 42, type: "context", content: "    <groupId>org.logging</groupId>" },
          { lineNumber: 43, type: "context", content: "    <artifactId>logging-lib</artifactId>" },
          { lineNumber: 44, type: "removed", content: "    <version>2.14.1</version>" },
          { lineNumber: 44, type: "added", content: "    <version>2.17.1</version>" },
          { lineNumber: 45, type: "context", content: "  </dependency>" },
        ],
      },
    ],
  },
  "MEND-9902": {
    summary: "Replace string-concatenated SQL with a parameterized query.",
    files: [
      {
        repoName: "analytics-ingestion",
        filePath: "src/main/java/com/spglobal/analytics/ReportQuery.java",
        lines: [
          { lineNumber: 18, type: "context", content: "  public List<Report> findByUser(String userId) {" },
          {
            lineNumber: 19,
            type: "removed",
            content: '    String sql = "SELECT * FROM reports WHERE user_id = \'" + userId + "\'";',
          },
          { lineNumber: 19, type: "added", content: '    String sql = "SELECT * FROM reports WHERE user_id = ?";' },
          { lineNumber: 20, type: "context", content: "    return jdbcTemplate.query(sql, rs -> map(rs), userId);" },
          { lineNumber: 21, type: "context", content: "  }" },
        ],
      },
    ],
  },
  "MEND-9700": {
    summary: "Upgrade the deserialization library and disable default typing in both services that use it.",
    files: [
      {
        repoName: "analytics-ingestion",
        filePath: "pom.xml",
        lines: [
          { lineNumber: 30, type: "context", content: "  <dependency>" },
          { lineNumber: 31, type: "context", content: "    <artifactId>data-ingest-lib</artifactId>" },
          { lineNumber: 32, type: "removed", content: "    <version>3.2.0</version>" },
          { lineNumber: 32, type: "added", content: "    <version>3.4.1</version>" },
          { lineNumber: 33, type: "context", content: "  </dependency>" },
        ],
      },
      {
        repoName: "analytics-reporting",
        filePath: "src/main/resources/application.yml",
        lines: [
          { lineNumber: 12, type: "context", content: "deserialization:" },
          { lineNumber: 13, type: "removed", content: "  enable-default-typing: true" },
          { lineNumber: 13, type: "added", content: "  enable-default-typing: false" },
        ],
      },
    ],
  },
};

export function getMockCodeFix(issueId: string): CodeFix | undefined {
  return MOCK_CODE_FIXES[issueId];
}

function diffLineColor(type: DiffLine["type"], role: "bg" | "marker" | "text"): string {
  if (type === "removed") {
    return role === "bg" ? "var(--mantine-color-red-0)" : role === "marker" ? "var(--mantine-color-red-7)" : "var(--mantine-color-red-9)";
  }
  if (type === "added") {
    return role === "bg"
      ? "var(--mantine-color-green-0)"
      : role === "marker"
        ? "var(--mantine-color-green-7)"
        : "var(--mantine-color-green-9)";
  }
  return role === "bg" ? "transparent" : role === "marker" ? "var(--mantine-color-gray-5)" : "var(--mantine-color-dark-6)";
}

function DiffBlock({ lines }: { lines: DiffLine[] }) {
  return (
    <Paper withBorder radius="sm" style={{ overflow: "hidden" }}>
      {lines.map((line, index) => (
        <Group
          key={index}
          gap={0}
          wrap="nowrap"
          style={{ background: diffLineColor(line.type, "bg"), fontFamily: "monospace", padding: "1px 8px" }}
        >
          <Text span size="xs" c="dimmed" style={{ width: 32, flexShrink: 0, userSelect: "none" }}>
            {line.lineNumber}
          </Text>
          <Text span size="xs" fw={700} style={{ width: 14, flexShrink: 0, color: diffLineColor(line.type, "marker") }}>
            {line.type === "removed" ? "-" : line.type === "added" ? "+" : " "}
          </Text>
          <Text span size="xs" style={{ whiteSpace: "pre", color: diffLineColor(line.type, "text") }}>
            {line.content}
          </Text>
        </Group>
      ))}
    </Paper>
  );
}

interface RepoGroup {
  repoName: string;
  files: FixFile[];
}

function groupFilesByRepo(files: FixFile[]): RepoGroup[] {
  const byRepo = new Map<string, FixFile[]>();
  for (const file of files) {
    const existing = byRepo.get(file.repoName) ?? [];
    existing.push(file);
    byRepo.set(file.repoName, existing);
  }
  return Array.from(byRepo.entries()).map(([repoName, repoFiles]) => ({ repoName, files: repoFiles }));
}

/** Git-diff-style view of a suggested fix, grouped by repo, with a per-repo "open pull request" action. */
export function CodeFixModal({
  issue,
  opened,
  onClose,
}: {
  issue: ScanIssue | null;
  opened: boolean;
  onClose: () => void;
}) {
  const [prOpenedRepos, setPrOpenedRepos] = useState<Set<string>>(new Set());

  const fix = issue ? MOCK_CODE_FIXES[issue.id] : undefined;
  const repoGroups = useMemo(() => (fix ? groupFilesByRepo(fix.files) : []), [fix]);

  function handleOpenPr(repoName: string) {
    setPrOpenedRepos((prev) => new Set(prev).add(repoName));
  }

  return (
    <Modal opened={opened} onClose={onClose} title={issue?.title ?? "Suggested fix"} size="xl">
      {!fix && (
        <Text c="dimmed" fs="italic">
          No suggested code fix is available for this issue yet.
        </Text>
      )}

      {fix && (
        <Stack gap="lg">
          <Text size="sm">{fix.summary}</Text>

          {repoGroups.map(({ repoName, files }) => {
            const prOpened = prOpenedRepos.has(repoName);
            return (
              <Stack key={repoName} gap="xs">
                <Group justify="space-between">
                  <Badge variant="light" color="gray" size="lg">
                    {repoName}
                  </Badge>
                  <Button
                    size="xs"
                    leftSection={prOpened ? <Check size={14} /> : <GitPullRequest size={14} />}
                    color={prOpened ? "green" : "blue"}
                    variant={prOpened ? "light" : "filled"}
                    disabled={prOpened}
                    onClick={() => handleOpenPr(repoName)}
                  >
                    {prOpened ? "Pull request opened" : "Open pull request"}
                  </Button>
                </Group>

                {files.map((file) => (
                  <Stack key={file.filePath} gap={4}>
                    <Text ff="monospace" size="xs" c="dimmed">
                      {file.filePath}
                    </Text>
                    <DiffBlock lines={file.lines} />
                  </Stack>
                ))}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Modal>
  );
}
