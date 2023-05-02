import { useEffect } from "react";
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
import { Row, Col } from "antd";

import { Inter } from "next/font/google";

import { useTauriLibs, useTauriLibs2 } from "@/hooks/tauri/tauriLibs.hook";
import { useQuery } from "react-query";
import { GitMessage } from "@/components/GitMessage/GitMessage";
import { shallow } from "zustand/shallow";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { useRootStore } from "@/stores/root.store";
import { take } from "rambda";
import MinimapScrollbar from "../../components/Scrollbars/MinimapScrollbar";

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

  const { data } = useQuery<any>(
    ["git", id],
    () =>
      tauriLibs.api.invoke("parse_git", {
        path: id,
      }),
    { enabled: Boolean(id) && Boolean(tauriLibs) }
  );

  const [activateTabId, toGitTab] = useRootStore(
    (rootStore) => rootStore.mainLayout,
    (state) => [state.activateTabId, state.toGitTab],
    shallow
  );
  useEffect(() => {
    if (activateTabId && tauriLibs) {
      (async () => {
        const tabTitle = await tauriLibs.path.basename(id as string);
        toGitTab(activateTabId, tabTitle, router.asPath);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tauriLibs]);

  return (
    <main>
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
      <MinimapScrollbar style={{ width: "100vw", height: "100vh" }}>
        <ol>
          {take(300, data?.commits || []).map((x: any) => (
            <li key={x.oid}>
              <GitMessage data={{ commit: x }} />
            </li>
          ))}
        </ol>
      </MinimapScrollbar>
      {/* <div style={{ width: "100vw", height: "90vh" }}>
        <ReactFlowProvider>
          <Flow commits={data?.commits || []} />
        </ReactFlowProvider>
      </div> */}
    </main>
  );
}
