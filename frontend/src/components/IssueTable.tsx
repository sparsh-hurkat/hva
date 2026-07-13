import { useEffect, useState } from "react";
import { Badge, Group, Pagination, Table, Text, TextInput, Tooltip, UnstyledButton } from "@mantine/core";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Wrench } from "lucide-react";
import { SEVERITY_LABELS, type IssueSortColumn, type SortDirection } from "../api";
import { useBuildIssues } from "../hooks";
import { ErrorState } from "./ErrorState";
import { Loading } from "./Loading";
import { SEVERITY_ICONS, SEVERITY_MANTINE_COLORS } from "./severityVisuals";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

interface SortableHeaderProps {
  label: string;
  column: IssueSortColumn;
  sortBy: IssueSortColumn;
  sortDirection: SortDirection;
  onSort: (column: IssueSortColumn) => void;
}

function SortableHeader({ label, column, sortBy, sortDirection, onSort }: SortableHeaderProps) {
  const isActive = sortBy === column;
  const Icon = isActive ? (sortDirection === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <Table.Th>
      <UnstyledButton onClick={() => onSort(column)}>
        <Group gap={4} wrap="nowrap">
          <Text size="xs" fw={700} tt="uppercase" c={isActive ? undefined : "dimmed"}>
            {label}
          </Text>
          <Icon size={12} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

/** Searchable, sortable, paginated table of a build's issues - fetched a page at a time from the API. */
export function IssueTable({
  workItemId,
  buildId,
  showRepoColumn,
}: {
  workItemId: number;
  buildId: number;
  showRepoColumn: boolean;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<IssueSortColumn>("severity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortDirection]);

  const { data, isLoading, isError, error } = useBuildIssues(workItemId, buildId, {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    sortBy,
    sortDirection,
  });

  function handleSort(column: IssueSortColumn) {
    if (column === sortBy) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Group justify="space-between" mb="sm" wrap="wrap">
        <TextInput
          placeholder="Search issues..."
          leftSection={<Search size={14} />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.currentTarget.value)}
          w={260}
        />
        {data && (
          <Text size="xs" c="dimmed">
            {total} issue{total === 1 ? "" : "s"}
          </Text>
        )}
      </Group>

      {isLoading && <Loading label="Loading issues..." />}
      {isError && <ErrorState message={error.message} />}

      {data && items.length === 0 && (
        <Text c="dimmed" fs="italic">
          No issues match your search.
        </Text>
      )}

      {data && items.length > 0 && (
        <>
          <Table withTableBorder withRowBorders verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <SortableHeader label="Severity" column="severity" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Issue" column="title" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                {showRepoColumn && <Table.Th>Repository</Table.Th>}
                <SortableHeader label="Tool" column="tool" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Detected" column="detected" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                <Table.Th>Fix</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((issue) => {
                const Icon = SEVERITY_ICONS[issue.severity];
                return (
                  <Table.Tr key={issue.id}>
                    <Table.Td>
                      <Badge color={SEVERITY_MANTINE_COLORS[issue.severity]} variant="filled" leftSection={<Icon size={12} />}>
                        {SEVERITY_LABELS[issue.severity]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {issue.title}
                      </Text>
                      <Text size="xs" c="dimmed" mt={2}>
                        {issue.description}
                      </Text>
                    </Table.Td>
                    {showRepoColumn && (
                      <Table.Td>
                        <Text ff="monospace" size="xs">
                          {issue.repoName}
                        </Text>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <Text size="sm">{issue.toolName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {issue.detectedAt ? new Date(issue.detectedAt).toLocaleDateString() : "—"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {issue.fixDetails ? (
                        <Tooltip label={issue.fixDetails} multiline w={280} withArrow>
                          <Group gap={4} wrap="nowrap" style={{ cursor: "default" }}>
                            <Wrench size={12} color="var(--mantine-color-green-7)" />
                            <Text size="xs" c="green.7" fw={600}>
                              Fix available
                            </Text>
                          </Group>
                        </Tooltip>
                      ) : (
                        <Text size="xs" c="dimmed">
                          —
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
            </Group>
          )}
        </>
      )}
    </>
  );
}
