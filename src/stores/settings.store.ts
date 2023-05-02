import { createStore } from "zustand";
import { produce } from "immer";
import { persist } from "zustand/middleware";

export interface AzureDevOpsConfig {
  organization?: string;
  project?: string;
  accessToken?: string;
}

export interface Settings {
  azureDevOps: AzureDevOpsConfig;
}

export interface SettingsState {
  settings: Settings;
  setSettings: (nextSettings: Settings) => void;
}

export const createSettingsStore = () =>
  createStore<SettingsState, [["zustand/persist", unknown]]>(
    persist(
      (set, get) => ({
        settings: { azureDevOps: {} },
        setSettings: (nextSettings) =>
          set((state) =>
            produce(state, (draft) => {
              draft.settings = nextSettings;
            })
          ),
      }),
      { name: "settings" }
    )
  );
