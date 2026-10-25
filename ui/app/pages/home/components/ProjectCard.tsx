import { memo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { relativeTime } from "@/app/format/relative-time";
import { thumbnailAspect } from "../domain/aspect-ratio";

type ProjectCardProps = {
  to: string;
  name: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  updatedAt: string;
  detail: string;
  placeholder: ReactNode;
};

/** A project's thumbnail, name and when it last changed. */
export const ProjectCard = memo(
  ({
    to,
    name,
    thumbnailUrl,
    width,
    height,
    updatedAt,
    detail,
    placeholder,
  }: ProjectCardProps) => {
    const { t, i18n } = useTranslation("home");
    const [broken, setBroken] = useState(false);
    const updated = relativeTime(
      new Date(updatedAt),
      new Date(),
      i18n.language,
    );

    return (
      <li>
        <Link
          to={to}
          className="flex h-full flex-col overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) transition-colors hover:border-(--color-border-strong) hover:bg-(--color-surface-2)"
        >
          <div
            className="flex items-center justify-center bg-(--color-bg) text-3xl text-(--color-text-muted)"
            style={{ aspectRatio: thumbnailAspect(width, height) }}
          >
            {broken ? (
              placeholder
            ) : (
              <img
                src={thumbnailUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain"
                onError={() => setBroken(true)}
              />
            )}
          </div>
          <div className="flex flex-col gap-0.5 px-3 py-2">
            <p className="truncate font-medium">{name}</p>
            <p className="text-xs text-(--color-text-muted)">
              {detail} · {t("updated", { when: updated })}
            </p>
          </div>
        </Link>
      </li>
    );
  },
);

ProjectCard.displayName = "ProjectCard";
