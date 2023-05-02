import { createStore } from "zustand";
import { produce } from "immer";

export interface AzureDevOpsConfig {
  organization: string;
  project: string;
  accessToken: string;
}

export interface SettingsState {
  azureDevOps?: AzureDevOpsConfig;
}

export const createSettingsStore = () =>
  createStore<SettingsState>((set, get) => ({
    setAzureDevOps: (config: AzureDevOpsConfig) =>
      set((state) =>
        produce(state, (draft) => {
          draft.azureDevOps = config;
        })
      ),
  }));
