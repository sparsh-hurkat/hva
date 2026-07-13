import { Badge, Group, Paper, Text } from "@mantine/core";
import { totalCount, type ToolSeverityCounts } from "../api";
import { SEVERITY_MANTINE_COLORS } from "./severityVisuals";

/**
 * One colored chip per tool: total issues, plus critical/high counts - the two
 * severities worth surfacing here (medium/low/info stay on the detail pages).
 */
export function ToolCriticalHighSummary({ toolCounts }: { toolCounts: ToolSeverityCounts[] }) {
  if (toolCounts.length === 0) {
    return null;
  }
  return (
    <Group gap="xs" wrap="wrap">
      {toolCounts.map((tool) => (
        <Paper key={tool.toolName} withBorder radius="sm" px={8} py={4}>
          <Group gap={6} wrap="nowrap">
            <Text size="xs" fw={700}>
              {tool.toolName}
            </Text>
            <Badge size="xs" variant="light" color="gray" radius="sm">
              {totalCount(tool.counts)} total
            </Badge>
            {tool.counts.critical > 0 && (
              <Badge size="xs" variant="filled" color={SEVERITY_MANTINE_COLORS.CRITICAL} radius="sm">
                {tool.counts.critical} critical
              </Badge>
            )}
            {tool.counts.high > 0 && (
              <Badge size="xs" variant="filled" color={SEVERITY_MANTINE_COLORS.HIGH} radius="sm">
                {tool.counts.high} high
              </Badge>
            )}
          </Group>
        </Paper>
      ))}
    </Group>
  );
}
