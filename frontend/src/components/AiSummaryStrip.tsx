import { Group, Text } from "@mantine/core";
import { Sparkles } from "lucide-react";

/**
 * Compact AI summary for repeated/list contexts (release item rows, build rows) -
 * clamped to 2 lines so it can't blow up row height. For a single "hero" summary at
 * the top of a page, use the full AiSummaryCard instead.
 */
export function AiSummaryStrip({ summary }: { summary: string }) {
  return (
    <Group gap={6} wrap="nowrap" align="flex-start" p={6} style={{ background: "var(--mantine-color-blue-1)", borderRadius: 6 }}>
      <Sparkles size={12} color="var(--mantine-color-blue-7)" style={{ flexShrink: 0, marginTop: 3 }} />
      <Text size="xs" c="dimmed" lineClamp={2}>
        {summary}
      </Text>
    </Group>
  );
}
