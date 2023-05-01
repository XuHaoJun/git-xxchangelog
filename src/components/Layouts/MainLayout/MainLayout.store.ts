import { createStore } from "zustand";

import {
  DEFAULT_FAVICONS,
  getInitialDefaultTabs,
  TabsProps,
} from "@/components/Tabs/Tabs";
import { produce } from "immer";

export interface MainLayoutState {
  tabs: TabsProps["tabs"];
  // <id, url>
  tabUrls: Record<string, string>;
  activateTabId?: string;

  toGitTab: (id: string, title: string, url: string) => void;
  setTabs: (tabs: MainLayoutState["tabs"]) => void;
  reset: () => void;
}

export const createMainLayoutStore = () =>
  createStore<MainLayoutState>((set, get) => ({
    tabs: getInitialDefaultTabs(),
    tabUrls: {},
    activateTabId: getInitialDefaultTabs()[0].id,

    toGitTab: (id: string, title: string, url: string) =>
      set((state) => ({
        tabs: state.tabs.map((x) =>
          x.id === id ? { ...x, title, favicon: DEFAULT_FAVICONS.git } : x
        ),
        tabUrls: {
          ...state.tabUrls,
          [id]: url,
        },
      })),
    setTabs: (tabs) =>
      set(() => ({ tabs, activateTabId: tabs.find((x) => x.active)?.id })),
    reset: () => set(() => ({ tabs: getInitialDefaultTabs() })),
  }));
