import { useContext, useEffect, useState, createContext } from "react";

import type { invoke } from "@tauri-apps/api";
import type { appLocalDataDir, dirname, basename } from "@tauri-apps/api/path";

export interface TauriLibs {
  api: {
    invoke: typeof invoke;
  };
  path: {
    dirname: typeof dirname;
    basename: typeof basename;
    appLocalDataDir: typeof appLocalDataDir;
  };
}

export const TauriLibsContext = createContext<{
  tauriLibs: TauriLibs;
}>(
  null as unknown as {
    tauriLibs: TauriLibs;
  }
);

export function useTauriLibs2(): {
  tauriLibs: TauriLibs;
} {
  return useContext(TauriLibsContext);
}

export function useTauriLibs(): {
  tauriLibs: TauriLibs;
} {
  const [libs, setLibs] = useState<TauriLibs>(null as unknown as TauriLibs);

  useEffect(() => {
    (async () => {
      const [{ invoke }, { appLocalDataDir, basename, dirname }] =
        await Promise.all([
          import("@tauri-apps/api"),
          import("@tauri-apps/api/path"),
        ]);
      setLibs({
        api: { invoke },
        path: { appLocalDataDir, basename, dirname },
      });
    })();
  }, []);

  return { tauriLibs: libs };
}
