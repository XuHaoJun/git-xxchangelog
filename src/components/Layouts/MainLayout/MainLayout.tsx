import { FC, ReactNode, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { shallow } from "zustand/shallow";
import { useStore } from "zustand";

import { useRootStore } from "@/stores/root.store";
import { NEW_TAB_TITLE, Tabs, generateTabId } from "@/components/Tabs/Tabs";
import type { TabsProps } from "@/components/Tabs/Tabs";
import { clone, equals } from "rambda";

export interface MainLayoutProps {
  tabs?: TabsProps["tabs"];
  onChangeTabs?: (nextTabs: TabsProps["tabs"]) => void;

  children?: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = (props) => {
  const { onChangeTabs } = props;

  const [tabs, setTabs] = useState<TabsProps["tabs"]>(props.tabs || []);

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
    let nextTabs = tabs.filter((tab) => tab.id !== tabId);
    nextTabs.splice(toIndex, 0, beforeTab);
    setTabs(nextTabs);
  };

  const newTab = () => {
    setTabs([
      ...tabs.map((x) => ({ ...x, active: false })),
      { id: generateTabId(), title: NEW_TAB_TITLE, active: true },
    ]);
  };

  useEffect(() => {
    if (!equals(tabs, props.tabs)) {
      setTabs(props.tabs || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.tabs]);

  useEffect(() => {
    if (onChangeTabs) {
      onChangeTabs(tabs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div className="sticky top-0">
        <Tabs
          tabs={tabs}
          onTabClose={close}
          onTabReorder={reorder}
          onTabActive={active}
          onNewTab={newTab}
        />
      </div>
      {props.children}
    </div>
  );
};

export const MainLayoutWithRoot = (
  props: Pick<MainLayoutProps, "children">
) => {
  const [tabs, setTabs, activateTabId, tabUrls] = useRootStore(
    (rootStore) => rootStore.mainLayout,
    (state) => [state.tabs, state.setTabs, state.activateTabId, state.tabUrls],
    shallow
  );

  const router = useRouter();
  const activateTab = tabs.find((x) => x.id === activateTabId);
  useEffect(() => {
    if (activateTab) {
      const url = tabUrls[activateTab.id] || "/new-tab";
      router.replace(url, undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activateTab]);

  return (
    <MainLayout tabs={tabs} onChangeTabs={setTabs}>
      {props.children}
    </MainLayout>
  );
};
