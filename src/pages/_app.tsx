import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";

import "@/styles/globals.css";
import { RootStoreContext, rootState } from "@/stores/root.store";
import { MainLayoutWithRoot } from "@/components/Layouts/MainLayout/MainLayout";

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
  return (
    <QueryClientProvider client={queryClient}>
      <RootStoreContext.Provider value={rootState}>
        <MainLayoutWithRoot>
          <Component {...pageProps} />
        </MainLayoutWithRoot>
      </RootStoreContext.Provider>
    </QueryClientProvider>
  );
}
