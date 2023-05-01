import dynamic from "next/dynamic";
import { v4 as uuidv4 } from "uuid";

import "@xuhaojun/react-chrome-tabs/css/chrome-tabs.css";

export type { TabProperties } from "@xuhaojun/react-chrome-tabs/dist/chrome-tabs";
export type { TabsProps } from "@xuhaojun/react-chrome-tabs";

export const Tabs = dynamic(
  () => import("@xuhaojun/react-chrome-tabs").then((x) => x.Tabs),
  {
    ssr: false,
  }
);

export const NEW_TAB_TITLE = "New Tab";

export function getInitialDefaultTabs() {
  return [
    {
      id: "8b499bd3-792d-4237-a451-ab87738638a7",
      title: NEW_TAB_TITLE,
      active: true,
    },
  ];
}

export const DEFAULT_FAVICONS = {
  git: "https://git-scm.com/favicon.ico",
};

export function generateTabId(): string {
  return uuidv4();
}
