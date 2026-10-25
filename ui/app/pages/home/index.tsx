import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Tabs } from "@/ui/components/primitives/tabs";
import { LanguageSelect } from "@/app/components/LanguageSelect";
import { ConnectClaudeCard } from "./components/ConnectClaudeCard";
import { ImagesTab } from "./components/ImagesTab";
import { VideosTab } from "./components/VideosTab";
import { useStudioLists } from "./hooks/useStudioLists";

export function meta() {
  return [{ title: "Relay" }];
}

const Home = memo(() => {
  const { t } = useTranslation("home");
  const { images, videos } = useStudioLists();

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p className="text-(--color-text-muted)">{t("subtitle")}</p>
          </div>
          <LanguageSelect />
        </header>
        <ConnectClaudeCard />
        <Tabs defaultValue="images">
          <Tabs.List>
            <Tabs.Trigger value="images">{t("images.tab")}</Tabs.Trigger>
            <Tabs.Trigger value="videos">{t("videos.tab")}</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="images">
            <ImagesTab images={images.data} error={images.error} />
          </Tabs.Content>
          <Tabs.Content value="videos">
            <VideosTab videos={videos.data} error={videos.error} />
          </Tabs.Content>
        </Tabs>
      </div>
    </main>
  );
});

Home.displayName = "Home";

export default Home;
