import { CircleAlert, Info, OctagonAlert, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import { totalCount, type Severity, type SeverityCounts } from "../api";

// Severity is a *status* color job (good -> critical, reserved meaning), not a generic
// categorical or sequential ramp - so it uses a small fixed scale, always paired with
// an icon + label rather than relying on color alone (warning/serious are intentionally
// sub-3:1 contrast on a light surface by design; the icon+label pairing is the mitigation).
export const SEVERITY_CHART_COLORS: Record<Severity, string> = {
  CRITICAL: "#d03b3b",
  HIGH: "#ec835a",
  MEDIUM: "#fab219",
  LOW: "#0ca30c",
  INFO: "#898781",
};

// Mantine theme color names for badges/icons elsewhere in the UI - same hue family as
// the chart colors above, but using Mantine's own tested shade scale for component chrome.
export const SEVERITY_MANTINE_COLORS: Record<Severity, string> = {
  CRITICAL: "red",
  HIGH: "orange",
  MEDIUM: "yellow",
  LOW: "green",
  INFO: "gray",
};

export const SEVERITY_ICONS: Record<Severity, LucideIcon> = {
  CRITICAL: OctagonAlert,
  HIGH: TriangleAlert,
  MEDIUM: CircleAlert,
  LOW: ShieldCheck,
  INFO: Info,
};

/** Quick-glance badge color: red if any critical, orange if any high, gray if other issues, green if clean. */
export function totalBadgeColor(counts: SeverityCounts): string {
  if (counts.critical > 0) return SEVERITY_MANTINE_COLORS.CRITICAL;
  if (counts.high > 0) return SEVERITY_MANTINE_COLORS.HIGH;
  if (totalCount(counts) > 0) return "gray";
  return "green";
}
