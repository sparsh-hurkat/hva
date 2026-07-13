import { Group, Paper, Text } from "@mantine/core";
import { Sparkles } from "lucide-react";

/** Plain-language callout, styled to stand out so a non-technical reader knows to read this first. */
export function AiSummaryCard({ summary, label = "AI summary" }: { summary: string; label?: string }) {
  return (
    <Paper withBorder radius="md" p="md" bg="blue.0" style={{ borderLeft: "4px solid var(--mantine-color-blue-6)" }}>
      <Group gap={6} mb={6}>
        <Sparkles size={15} color="var(--mantine-color-blue-6)" />
        <Text size="xs" fw={700} tt="uppercase" c="blue.7" style={{ letterSpacing: 0.4 }}>
          {label}
        </Text>
      </Group>
      <Text size="sm" style={{ lineHeight: 1.6 }}>
        {summary}
      </Text>
    </Paper>
  );
}
