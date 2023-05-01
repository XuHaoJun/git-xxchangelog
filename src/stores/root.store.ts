import { createContext, useContext } from "react";
import { StoreApi } from "zustand";

import {
  MainLayoutState,
  createMainLayoutStore,
} from "@/components/Layouts/MainLayout/MainLayout.store";
import { GitState, createGitStore } from "./git.store";

export interface RootState {
  mainLayout: StoreApi<MainLayoutState>;
  git: StoreApi<GitState>;
}

export const rootState: RootState = {
  mainLayout: createMainLayoutStore(),
  git: createGitStore(),
};

export const RootStoreContext = createContext<RootState>(rootState);

export const useRootStore = () => {
  return useContext(RootStoreContext);
};
