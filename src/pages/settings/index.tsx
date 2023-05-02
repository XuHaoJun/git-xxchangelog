import { useRootStore } from "@/stores/root.store";
import { useEffect } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";

export default function SettingsPage() {
  const rootStore = useRootStore();
  const [activateTabId, toSettingsTab] = useStore(
    rootStore.mainLayout,
    (state) => [
      state.activateTabId,
      state.toSettingsTab,
    ],
    shallow
  );

  // useEffect(() => {
  //   if (activateTabId) {
  //     console.log("activateTabId", activateTabId);
  //     toSettingsTab(activateTabId);
  //   }
  // }, [activateTabId]);

  return <main>settings page</main>;
}
