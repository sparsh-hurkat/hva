import { Badge, HoverCard } from "@mantine/core";
import { totalCount, type SeverityCounts, type ToolSeverityCounts } from "../api";
import { totalBadgeColor } from "./severityVisuals";
import { ToolCriticalHighSummary } from "./ToolCriticalHighSummary";

/**
 * A single "N issues" badge, colored by severity at a glance, with one hover revealing
 * the per-tool total/critical/high breakdown. Shared by the release-item list rows and
 * the build rows on the release item detail page.
 */
export function IssueCountBadge({
  totalCounts,
  toolCounts,
}: {
  totalCounts: SeverityCounts;
  toolCounts: ToolSeverityCounts[];
}) {
  const total = totalCount(totalCounts);

  return (
    <HoverCard width={320} shadow="md" withArrow openDelay={100} closeDelay={100} disabled={total === 0}>
      <HoverCard.Target>
        <Badge
          variant="light"
          color={totalBadgeColor(totalCounts)}
          size="lg"
          radius="sm"
          style={{ cursor: "default", flexShrink: 0 }}
        >
          {total} issue{total === 1 ? "" : "s"}
        </Badge>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <ToolCriticalHighSummary toolCounts={toolCounts} />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
