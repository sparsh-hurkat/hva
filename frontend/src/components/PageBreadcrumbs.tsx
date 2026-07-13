import { Link } from "react-router-dom";
import { Anchor, Breadcrumbs, Text } from "@mantine/core";

export interface Crumb {
  label: string;
  to?: string;
}

/** Home > Release item > Build - the current page is plain text, everything before it is a link. */
export function PageBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumbs>
      {crumbs.map((crumb, index) =>
        crumb.to ? (
          <Anchor key={index} component={Link} to={crumb.to} size="sm">
            {crumb.label}
          </Anchor>
        ) : (
          <Text key={index} size="sm" c="dimmed">
            {crumb.label}
          </Text>
        ),
      )}
    </Breadcrumbs>
  );
}
