import { memo, type ReactNode } from "react";

import { Alert } from "@/ui/components/primitives/alert";
import { EmptyState } from "@/ui/components/primitives/empty-state";
import { Spinner } from "@/ui/components/primitives/spinner";

type ProjectGridProps = {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  empty: { icon: ReactNode; title: string; description: string };
  children: ReactNode;
};

/** Loading, error and empty states around a grid of project cards. */
export const ProjectGrid = memo(
  ({ loading, error, isEmpty, empty, children }: ProjectGridProps) => {
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      );
    }
    if (isEmpty) return <EmptyState {...empty} />;
    return (
      <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </ul>
    );
  },
);

ProjectGrid.displayName = "ProjectGrid";
