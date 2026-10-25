import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** Back to the studio, the page title and optional actions on the right. */
export const PageHeader = memo(
  ({ title, subtitle, actions }: PageHeaderProps) => {
    const { t } = useTranslation();

    return (
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            aria-label={t("back")}
            className="rounded-(--radius-sm) p-2 text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)"
          >
            <FiArrowLeft aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-(--color-text-muted)">{subtitle}</p>
            )}
          </div>
        </div>
        {actions}
      </header>
    );
  },
);

PageHeader.displayName = "PageHeader";
