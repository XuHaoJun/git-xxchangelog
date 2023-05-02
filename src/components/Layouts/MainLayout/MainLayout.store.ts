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

  setTabs: (tabs: MainLayoutState["tabs"]) => void;

  toGitTab: (id: string, title: string, url: string) => void;
  toSettingsTab: (id: string) => void;
  toNewTab: (id: string) => void;

  reset: () => void;
}

export const createMainLayoutStore = () =>
  createStore<MainLayoutState>((set, get) => ({
    tabs: getInitialDefaultTabs(),
    tabUrls: {},
    activateTabId: getInitialDefaultTabs()[0].id,

    setTabs: (tabs) =>
      set(() => ({ tabs, activateTabId: tabs.find((x) => x.active)?.id })),

    toGitTab: (id: string, title: string, url: string) =>
      set((state) => ({
        tabs: state.tabs.map((x) =>
          x.id === id
            ? produce(x, (draft) => {
                draft.title = title;
                draft.favicon = DEFAULT_FAVICONS.git;
              })
            : x
        ),
        tabUrls: {
          ...state.tabUrls,
          [id]: url,
        },
        activateTabId: state.tabs.find((x) => x.active)?.id,
      })),

    toSettingsTab: (id: string) =>
      set((state) => ({
        tabs: state.tabs.map((x) =>
          x.id === id
            ? produce(x, (draft) => {
                draft.title = "Settings";
              })
            : x
        ),
        tabUrls: {
          ...state.tabUrls,
          [id]: "/settings",
        },
        activateTabId: state.tabs.find((x) => x.active)?.id,
      })),

    toNewTab: (id: string) =>
      set((state) => ({
        tabs: state.tabs.map((x) =>
          x.id === id
            ? produce(x, (draft) => {
                draft.title = "New Tab";
              })
            : x
        ),
        tabUrls: produce(state.tabUrls, (draft) => {
          delete draft[id];
        }),
        activateTabId: state.tabs.find((x) => x.active)?.id,
      })),

    reset: () => set(() => ({ tabs: getInitialDefaultTabs() })),
  }));
