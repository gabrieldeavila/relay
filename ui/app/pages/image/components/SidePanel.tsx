import { memo, type ReactNode } from "react";

type SidePanelProps = { title: string; children: ReactNode };

export const SidePanel = memo(({ title, children }: SidePanelProps) => (
  <section className="flex flex-col gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3">
    <h2 className="text-sm font-semibold text-(--color-text-muted)">{title}</h2>
    {children}
  </section>
));

SidePanel.displayName = "SidePanel";
