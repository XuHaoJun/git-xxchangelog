import Image from "next/image";
import "@xuhaojun/react-chrome-tabs/css/chrome-tabs.css";

import { Inter } from "next/font/google";
import { useMemo, useState } from "react";

import type { TabsProps } from "@xuhaojun/react-chrome-tabs";
import dynamic from "next/dynamic";

const Tabs = dynamic(
  () => import("@xuhaojun/react-chrome-tabs").then((x) => x.Tabs),
  {
    ssr: false,
  }
);

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [commits, setCommits] = useState<any[]>([]);
  const handleClick = async () => {
    const [{ open }, { appDataDir }, { invoke }] = await Promise.all([
      import("@tauri-apps/api/dialog"),
      import("@tauri-apps/api/path"),
      import("@tauri-apps/api"),
    ]);
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: await appDataDir(),
    });
    if (selected) {
      const resp: any = await invoke("print_git", { path: selected });
      setCommits(resp.commits);
    }
  };

  const [tabs, setTabs] = useState<TabsProps["tabs"]>([
    {
      id: "repo1",
      title: "repo1",
      active: true,
      favicon: "https://git-scm.com/favicon.ico",
    },
    {
      id: "repo2",
      title: "repo2",
      active: false,

      favicon: "https://git-scm.com/favicon.ico",
    },
    {
      id: "repo3",
      title: "repo3",
      active: false,

      favicon: "https://git-scm.com/favicon.ico",
    },
  ]);
  const active = (id: string) => {
    setTabs(tabs.map((tab) => ({ ...tab, active: id === tab.id })));
  };

  const close = (id: string) => {
    setTabs(tabs.filter((tab) => tab.id !== id));
  };

  const reorder = (tabId: string, fromIndex: number, toIndex: number) => {
    const beforeTab = tabs.find((tab) => tab.id === tabId);
    if (!beforeTab) {
      return;
    }
    let newTabs = tabs.filter((tab) => tab.id !== tabId);
    newTabs.splice(toIndex, 0, beforeTab);
    setTabs(newTabs);
  };

  const newTab = () => {
    setTabs([
      ...tabs.map((x) => ({ ...x, active: false })),
      { id: `${Math.random()}`, title: "New tab", active: true },
    ]);
  };

  const activeTabId = useMemo(() => tabs.find((x) => x.active)?.id, [tabs]);

  return (
    <main style={{ width: "100%", height: "100%" }}>
      <div className="sticky top-0">
        <Tabs
          tabs={tabs}
          onTabClose={close}
          onTabReorder={reorder}
          onTabActive={active}
          onNewTab={newTab}
        />
      </div>
      <button onClick={handleClick}>open repo</button>
      {activeTabId === "repo1" && (
        <ol>
          {commits.map((x) => (
            <li key={x.oid}>
              <div>
                {x.author.name}&nbsp;{x.author.email}
              </div>
              <div>{x.message}</div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
