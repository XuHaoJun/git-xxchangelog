import { useEffect, useMemo } from "react";
import type { WheelEvent } from "react";

import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  PanOnScrollMode,
  useKeyPress,
} from "reactflow";
// import "reactflow/dist/style.css";
import { Row, Col, Layout, Breadcrumb, Menu, MenuProps } from "antd";

import { Inter } from "next/font/google";

import { useTauriLibs, useTauriLibs2 } from "@/hooks/tauri/tauriLibs.hook";
import { useQuery } from "react-query";
import { GitMessage } from "@/components/GitMessage/GitMessage";
import { shallow } from "zustand/shallow";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { useRootStore } from "@/stores/root.store";
import { clamp, isEmpty, sort, tail, take } from "rambda";
import MinimapScrollbar from "../../components/Scrollbars/MinimapScrollbar";
import GitTable from "@/components/GitTable/GitTable";
import ResizableColumns from "@/components/ResizableColumns";
import styled from "styled-components";
import {
  FolderOutlined,
  BranchesOutlined,
  CloudOutlined,
  LaptopOutlined,
} from "@ant-design/icons";

type MenuItem = Required<MenuProps>["items"][number];

const { Header, Content, Footer, Sider } = Layout;
// import { Header, Content, Footer } from "antd/es/layout/layout";
// import Sider from "antd/es/layout/Sider";

const inter = Inter({ subsets: ["latin"] });

const nodeTypes = {
  gitMessage: GitMessage,
};

function Flow({ commits }: any) {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "1",
      data: {
        label: "Input Node",
      },
      position: { x: 250, y: 0 },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { setViewport, getViewport, zoomIn, zoomOut } = useReactFlow();

  // const spacePressed = useKeyPress("k");
  // useEffect(() => {
  //   if (spacePressed) {
  //     const viewport = getViewport();
  //     setViewport({ ...viewport, y: viewport.y + 300 });
  //   }
  // }, [getViewport, setViewport, spacePressed]);

  const handleScroll = useCallback(
    (e: WheelEvent<Element> | undefined) => {
      const viewport = getViewport();
      setViewport({ ...viewport, y: viewport.y + (e?.deltaY || 0) * -1 * 3 });
    },
    [setViewport, getViewport]
  );

  useEffect(() => {
    const dotNodes = commits.map((x: { oid: any }, i: number) => ({
      id: x.oid,
      draggable: false,
      className: "circle",
      style: {
        background: "#2B6CB0",
      },
      data: {
        label: "",
      },
      position: {
        x: 16,
        y: i * 70,
      },
    }));
    const msgNodes = commits.map((x: { oid: any }, i: number) => ({
      id: `message-${x.oid}`,
      draggable: false,
      type: "gitMessage",
      data: {
        label: "",
        commit: x,
        onWheel: handleScroll,
      },
      position: {
        x: 66,
        y: i * 70,
      },
    }));
    const nextEdges = commits.map(
      (x: { oid: any }, i: number, xs: { oid: any }[]) => ({
        id: `edge-${x.oid}`,
        source: xs[i - 1]?.oid,
        target: x.oid,
      })
    );
    setNodes([...dotNodes, ...msgNodes]);
    setEdges(nextEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commits]);

  return (
    <ReactFlow
      onPaneScroll={handleScroll}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      attributionPosition="top-right"
      nodeTypes={nodeTypes}
      onlyRenderVisibleElements={true}
      fitView={false}
      zoomOnScroll={false}
      zoomOnDoubleClick={false}
      // panOnDrag={false}
    >
      {/* <Controls /> */}
      <Background color="#aaa" gap={16} />
    </ReactFlow>
  );
}

export default function GitPage() {
  const { tauriLibs } = useTauriLibs2();
  const router = useRouter();
  const { id } = router.query;

  const { data: refsHash } = useQuery<any>(
    ["git_refs_hash", id],
    () =>
      tauriLibs.api.invoke("git_refs_hash", {
        path: id,
      }),
    {
      enabled: Boolean(id) && Boolean(tauriLibs),
      refetchInterval: 30 * 1000,
      staleTime: 0,
      cacheTime: 0,
    }
  );

  const { data: gitResp } = useQuery<any>(
    ["git", id, refsHash],
    () =>
      tauriLibs.api.invoke("parse_git", {
        path: id,
      }),
    { enabled: Boolean(id) && Boolean(tauriLibs) && Boolean(refsHash) }
  );

  const [activateTabId, toGitTab] = useRootStore(
    (rootStore) => rootStore.mainLayout,
    (state) => [state.activateTabId, state.toGitTab],
    shallow
  );
  useEffect(() => {
    if (activateTabId) {
      (async () => {
        const tabTitle = await tauriLibs.path.basename(id as string);
        toGitTab(activateTabId, tabTitle, router.asPath);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: MenuItem[] = useMemo(
    () => [
      {
        key: "local",
        label: "LOCAL",
        icon: <LaptopOutlined />,
        children: gitResp.branches
          ? getLocalBranchesMenuItems(gitResp.branches)
          : [],
      },
      {
        key: "remote",
        label: "REMOTE",
        icon: <CloudOutlined />,
        children: gitResp?.branches
          ? getRemoteBranchesMenuItems(gitResp.branches)
          : [],
      },
      {
        key: "issues",
        label: "ISSUES",
      },
      {
        key: "tags",
        label: "TAGS",
      },
    ],
    [gitResp?.branches]
  );

  return (
    <RootStyledDiv>
      <Layout style={{ display: "flex", flexGrow: 1 }}>
        <Header style={{ height: 84, background: "#ffffff" }}>
          {/* <Breadcrumb
          separator=">"
          items={[
            {
              title: "Home",
            },
            {
              title: "Application Center",
              href: "",
            },
            {
              title: "Application List",
              href: "",
            },
            {
              title: "An Application",
            },
          ]}
        /> */}
        </Header>
        <Layout>
          <Sider width={300} className="xu-left-sider">
            <Menu
              style={{ overflow: "auto" }}
              defaultSelectedKeys={["1"]}
              defaultOpenKeys={[]}
              mode="inline"
              theme="dark"
              items={items}
            />
          </Sider>
          <Content className="xu-content">
            {/* <ol>
        {commits.map((x) => (
          <li key={x.oid}>
            <a>{take(12, x.oid)}</a>&nbsp;{x.author.name}&nbsp;{x.author.email}
            &nbsp;&nbsp;
            {x.message.split("\n")[0]}
          </li>
        ))}
      </ol>
      <Gitgraph key={Math.random()}>
        {(gitgraph) => {
          const main = gitgraph.branch("main");
          reverse(commits).forEach((x, i) => {
            if (x.parent_count > 1) {
              const b = gitgraph.branch(`${i}`);
              b.commit(x.message.split("\n")[0]);
              main.merge(b);
            }
          });
        }}
      </Gitgraph> */}
            <GitTable dataSource={gitResp?.commits || []}></GitTable>
            {/* <ResizableColumns/> */}
            {/* <MinimapScrollbar style={{ width: "100vw", height: "100vh" }}>
        <ol>
          {take(150, gitResp?.commits || []).map((x: any) => (
            <li key={x.oid}>
              <GitMessage data={{ commit: x }} />
            </li>
          ))}
        </ol>
      </MinimapScrollbar> */}
            {/* <div style={{ width: "100vw", height: "90vh" }}>
        <ReactFlowProvider>
          <Flow commits={data?.commits || []} />
        </ReactFlowProvider>
      </div> */}
          </Content>
          <Sider width={400}></Sider>
        </Layout>
        <Footer style={{ height: "28px", padding: 0 }}>
          status bar like vscode
        </Footer>
      </Layout>
    </RootStyledDiv>
  );
}

const RootStyledDiv = styled.div`
  --content-height: calc(100vh - 46px - 84px - 28px);
  .xu-content {
    height: var(--content-height);
  }
  .xu-left-sider {
    height: var(--content-height);
    max-height: var(--content-height);
    overflow: auto;
  }
`;

interface GitBranch {
  name: string;
  oid: string;
  branch_type: "local" | "remote";
}

function gitBranchesToMenuItems(branches: GitBranch[]): MenuItem[] {
  interface Node {
    name: string;
    branch: GitBranch;
    children: Node[];
  }

  const root: Pick<Node, "children"> = { children: [] };
  for (const branch of branches) {
    let currentNode = root;
    for (const name of branch.name.split("/")) {
      if (!name) continue;
      let childNode: Node | undefined = currentNode.children.find(
        (child) => child.name === name
      );
      if (!childNode) {
        childNode = {
          name,
          branch,
          children: [],
        };
        currentNode.children.push(childNode);
      }
      currentNode = childNode;
    }
  }

  const sorter = sort<Node>((a, b) => {
    if (clamp(0, 1, a.children.length) > clamp(0, 1, b.children.length))
      return -1;
    if (clamp(0, 1, a.children.length) < clamp(0, 1, b.children.length))
      return 1;
    const nameCompare = a.name
      .toLowerCase()
      .localeCompare(b.name.toLowerCase());
    if (nameCompare !== 0) return nameCompare;
    return 0;
  });
  function nodesToMenuItems(xs: Node[]): MenuItem[] {
    return sorter(xs).map((x) => {
      const hasChildren = !isEmpty(x.children);

      const children = hasChildren ? nodesToMenuItems(x.children) : undefined;
      const icon = hasChildren ? <FolderOutlined /> : <BranchesOutlined />;
      return {
        key: x.branch.name,
        label: x.name,
        icon,
        children,
      };
    });
  }

  return nodesToMenuItems(root.children);
}

function getRemoteBranchesMenuItems(brances: GitBranch[]): MenuItem[] {
  return gitBranchesToMenuItems(
    brances
      .filter((x) => x.branch_type === "remote")
      .map((x) => ({ ...x, name: tail(x.name.split("/")).join("/") }))
  );
}

function getLocalBranchesMenuItems(brances: GitBranch[]): MenuItem[] {
  return gitBranchesToMenuItems(
    brances.filter((x) => x.branch_type === "local")
  );
}
