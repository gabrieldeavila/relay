import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiPlay, FiUploadCloud } from "react-icons/fi";
import { Link } from "react-router";

import { Badge } from "@/ui/components/primitives/badge";
import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import type { SaveState } from "../hooks/useWorkflowDraft";
import { SaveStatus } from "./SaveStatus";

type EditorTopBarProps = {
  name: string;
  latestVersion: number | null;
  saveState: SaveState;
  publishing: boolean;
  running: boolean;
  onRename: (name: string) => void;
  onPublish: () => void;
  onRun: () => void;
};

export const EditorTopBar = memo((props: EditorTopBarProps) => {
  const { t } = useTranslation("editor");

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-(--color-border) px-4 py-2">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-(--color-text-muted) hover:text-(--color-text)"
      >
        <FiArrowLeft aria-hidden="true" />
        {t("back")}
      </Link>
      <div className="w-64">
        <Input
          aria-label={t("name")}
          value={props.name}
          onChange={(event) => props.onRename(event.target.value)}
        />
      </div>
      <SaveStatus state={props.saveState} />
      <div className="ml-auto flex items-center gap-2">
        {props.latestVersion ? (
          <Badge variant="success">{t("published", { version: props.latestVersion })}</Badge>
        ) : (
          <Badge>{t("notPublished")}</Badge>
        )}
        <Button
          variant="secondary"
          leftIcon={<FiPlay aria-hidden="true" />}
          isLoading={props.running}
          onClick={props.onRun}
        >
          {t("run")}
        </Button>
        <Button
          leftIcon={<FiUploadCloud aria-hidden="true" />}
          isLoading={props.publishing}
          onClick={props.onPublish}
        >
          {t("publish")}
        </Button>
      </div>
    </header>
  );
});

EditorTopBar.displayName = "EditorTopBar";
