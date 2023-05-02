import { createContext, useContext } from "react";
import { StoreApi, useStore } from "zustand";

import {
  MainLayoutState,
  createMainLayoutStore,
} from "@/components/Layouts/MainLayout/MainLayout.store";
import { GitState, createGitStore } from "./git.store";
import { identity } from "rambda";
import { SettingsState, createSettingsStore } from "./settings.store";

export interface RootState {
  mainLayout: StoreApi<MainLayoutState>;
  git: StoreApi<GitState>;
  settings: StoreApi<SettingsState>;
}

export const rootState: RootState = {
  mainLayout: createMainLayoutStore(),
  git: createGitStore(),
  settings: createSettingsStore(),
};

export const RootStoreContext = createContext<RootState>(rootState);

type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;
type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "subscribe">;
type WithReact<S extends ReadonlyStoreApi<unknown>> = S & {
  getServerState?: () => ExtractState<S>;
};

export function useRootStore<S extends WithReact<StoreApi<unknown>>, U>(
  rootSelector: (rootState: RootState) => S,
  selector: (state: ExtractState<S>) => U,
  equalityFn?: (a: U, b: U) => boolean
): U;

export function useRootStore<S extends WithReact<StoreApi<unknown>>>(
  rootSelector: (rootState: RootState) => S
): ExtractState<S>;

export function useRootStore<S extends WithReact<StoreApi<unknown>>, U>(
  rootSelector: (rootState: RootState) => S,
  selector?: (state: ExtractState<S>) => U,
  equalityFn?: (a: U, b: U) => boolean
): U {
  const rootStore = useContext(RootStoreContext);
  return useStore(
    rootSelector(rootStore),
    selector || (identity as (state: ExtractState<S>) => U),
    equalityFn
  );
}
