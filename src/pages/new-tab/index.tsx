import { useEffect } from "react";
import { open as dialogOpen } from "@tauri-apps/api/dialog";
import { Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { shallow } from "zustand/shallow";

import { useTauriLibs, useTauriLibs2 } from "@/hooks/tauri/tauriLibs.hook";
import { useRootStore } from "@/stores/root.store";

export default function NewTabPage() {
  const { tauriLibs } = useTauriLibs2();

  const [activateTabId, toNewTab] = useRootStore(
    (rootStore) => rootStore.mainLayout,
    (state) => [state.activateTabId, state.toNewTab],
    shallow
  );

  const router = useRouter();

  const handleClick = async () => {
    const selected = (await dialogOpen({
      directory: true,
      multiple: false,
      defaultPath: await tauriLibs.path.appLocalDataDir(),
    })) as string | undefined;
    if (selected) {
      router.replace(`/git/${encodeURIComponent(selected)}`);
    }
  };

  useEffect(() => {
    if (activateTabId) {
      toNewTab(activateTabId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <Button onClick={handleClick}>open repo</Button>
      <Link href="/settings">config</Link>
    </main>
  );
}
