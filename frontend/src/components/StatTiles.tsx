import { Group, Paper, SimpleGrid, Text, ThemeIcon } from "@mantine/core";
import type { LucideIcon } from "lucide-react";

export interface StatTileData {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

/** A row of headline numbers (KPI tiles) - the fastest way to read "how bad is this" at a glance. */
export function StatTiles({ tiles }: { tiles: StatTileData[] }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: tiles.length }} spacing="md">
      {tiles.map((tile) => (
        <Paper key={tile.label} withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <div>
              <Text size="sm" c="dimmed">
                {tile.label}
              </Text>
              <Text size="xl" fw={700} mt={2}>
                {tile.value.toLocaleString()}
              </Text>
            </div>
            <ThemeIcon variant="light" color={tile.color} size={38} radius="md">
              <tile.icon size={20} />
            </ThemeIcon>
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
