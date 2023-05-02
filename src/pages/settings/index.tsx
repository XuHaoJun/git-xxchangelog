import { useRootStore } from "@/stores/root.store";
import { useEffect } from "react";
import { shallow } from "zustand/shallow";

export default function SettingsPage() {
  const [activateTabId, toSettingsTab] = useRootStore(
    (rootStore) => rootStore.mainLayout,
    (state) => [state.activateTabId, state.toSettingsTab],
    shallow
  );

  useEffect(() => {
    if (activateTabId) {
      toSettingsTab(activateTabId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <main>settings page</main>;
}
