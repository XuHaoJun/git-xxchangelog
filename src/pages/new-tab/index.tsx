import { MainLayoutWithRoot } from "@/components/Layouts/MainLayout/MainLayout";
import { useTauriLibs } from "@/hooks/tauri/tauriLibs.hook";
import { useRootStore } from "@/stores/root.store";
import { open as dialogOpen } from "@tauri-apps/api/dialog";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";

export default function NewTabPage() {
  const { tauriLibs } = useTauriLibs();

  const rootStore = useRootStore();
  const [activateTabId, toGitTab] = useStore(
    rootStore.mainLayout,
    (state) => [state.activateTabId, state.toGitTab],
    shallow
  );
  const [addRepo] = useStore(
    rootStore.git,
    (state) => [state.addRepo],
    shallow
  );

  const handleClick = async () => {
    const selected = (await dialogOpen({
      directory: true,
      multiple: false,
      defaultPath: await tauriLibs.path.appLocalDataDir(),
    })) as string | undefined;
    if (selected) {
      const resp: any = await tauriLibs.api.invoke("parse_git", {
        path: selected,
      });
      if (activateTabId) {
        const tabTitle = await tauriLibs.path.basename(selected);
        toGitTab(
          activateTabId,
          tabTitle,
          `/git/${encodeURIComponent(selected)}`
        );
      }
      addRepo(resp);
    }
  };

  return (
    <main>
      <button onClick={handleClick}>open repo</button>
    </main>
  );
}
