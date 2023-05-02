import { MainLayoutWithRoot } from "@/components/Layouts/MainLayout/MainLayout";
import { useTauriLibs } from "@/hooks/tauri/tauriLibs.hook";
import { useRootStore } from "@/stores/root.store";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";

// export default function HomePage() {
//   const rootStore = useRootStore();
//   const [tabs, activateTabId, tabUrls] = useStore(
//     rootStore.mainLayout,
//     (state) => [state.tabs, state.activateTabId, state.tabUrls],
//     shallow
//   );

//   const [tabUrl, setTabUrl] = useState<TabUrl>();
//   const activateTab = tabs.find((x) => x.id === activateTabId);
//   useEffect(() => {
//     if (activateTabId) {
//       setTabUrl(tabUrls[activateTabId]);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activateTab]);

//   return (
//     <MainLayoutWithRoot>
//       {tabUrl?.page === "git" ? <GitPage></GitPage> : <NewTabPage></NewTabPage>}
//     </MainLayoutWithRoot>
//   );
// }

export default function HomePage() {
  // const router = useRouter();
  // router.replace("/new-tab");
  return <div>Loading...</div>;
}
