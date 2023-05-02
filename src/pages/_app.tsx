import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";

import "@/styles/globals.css";
import "antd/dist/reset.css";
import { RootStoreContext, rootState } from "@/stores/root.store";
import { MainLayoutWithRoot } from "@/components/Layouts/MainLayout/MainLayout";
import { TauriLibsContext, useTauriLibs } from "@/hooks/tauri/tauriLibs.hook";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const libs = useTauriLibs();
  if (!libs) {
    return <div>Loading...</div>;
  }
  return (
    <TauriLibsContext.Provider value={libs}>
      <QueryClientProvider client={queryClient}>
        <RootStoreContext.Provider value={rootState}>
          <MainLayoutWithRoot>
            <Component {...pageProps} />
          </MainLayoutWithRoot>
        </RootStoreContext.Provider>
      </QueryClientProvider>
    </TauriLibsContext.Provider>
  );
}
