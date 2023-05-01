import { createStore } from "zustand";
import { produce } from "immer";

export interface GitRepo {
  path: string;
  commits: any[];
}

export interface GitState {
  repos: Record<string, GitRepo>;

  addRepo: (repo: GitRepo) => void;
}

export const createGitStore = () =>
  createStore<GitState>((set, get) => ({
    repos: {},

    addRepo: (repo) =>
      set(
        produce((state) => {
          state[repo.path] = repo;
        })
      ),
  }));
