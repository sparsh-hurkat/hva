import { AppShell, Container, Group, Text, ThemeIcon } from "@mantine/core";
import { ShieldCheck } from "lucide-react";
import { Route, Routes } from "react-router-dom";
import { BuildDetailPage } from "./pages/BuildDetailPage";
import { ReleaseItemDetailPage } from "./pages/ReleaseItemDetailPage";
import { ReleaseItemListPage } from "./pages/ReleaseItemListPage";

export function App() {
  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <Container size="md" h="100%" style={{ display: "flex", alignItems: "center" }}>
          <Group gap="xs">
            <ThemeIcon variant="light" color="blue" size={32} radius="md">
              <ShieldCheck size={18} />
            </ThemeIcon>
            <Text fw={700} size="lg">
              Release Security Scans
            </Text>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main bg="gray.0">
        <Container size="md" py="xl">
          <Routes>
            <Route path="/" element={<ReleaseItemListPage />} />
            <Route path="/release-items/:workItemId" element={<ReleaseItemDetailPage />} />
            <Route path="/release-items/:workItemId/builds/:buildId" element={<BuildDetailPage />} />
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
