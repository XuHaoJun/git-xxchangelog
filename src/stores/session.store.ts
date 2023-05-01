import { createStore } from "zustand";

import type { MainLayoutState } from "@/components/Layouts/MainLayout/MainLayout.store";

export interface SessionState {
  tabs?: MainLayoutState["tabs"];
  tabUrls?: MainLayoutState["tabUrls"];
}

export const createSessionStore = () =>
  createStore<SessionState>((set, get) => ({}));
