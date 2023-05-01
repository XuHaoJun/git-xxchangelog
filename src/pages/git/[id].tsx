import { useContext, useEffect, useMemo, useState } from "react";
import type { WheelEvent } from "react";
import Image from "next/image";

import { reverse, take } from "rambda";

import { open as shellOpen } from "@tauri-apps/api/shell";
import { open as dialogOpen } from "@tauri-apps/api/dialog";

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

import { useTauriLibs } from "@/hooks/tauri/tauriLibs.hook";
import { useQuery } from "react-query";
import { Tabs } from "@/components/Tabs/Tabs";
import type { TabsProps } from "@/components/Tabs/Tabs";
import { GitMessage } from "@/components/GitMessage/GitMessage";
import { MainLayoutWithRoot } from "@/components/Layouts/MainLayout/MainLayout";
import { RootStoreContext, useRootStore } from "@/stores/root.store";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";

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
  //   console.log("space pressed", spacePressed);
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

  console.log("render");

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
  const { tauriLibs } = useTauriLibs();
  const router = useRouter();
  const { id } = router.query;

  const { data } = useQuery<any>(
    ["git", id],
    () =>
      tauriLibs.api.invoke("parse_git", {
        path: id,
      }),
    { enabled: Boolean(id) }
  );
  console.log(data);

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
      <Scrollbars style={{ width: "100vw", height: "90vh" }}>
        <ol>
          {data?.commits.map((x: any) => (
            <li key={x.oid}>
              <GitMessage data={{ commit: x }} />
            </li>
          ))}
        </ol>
      </Scrollbars>
      {/* <div style={{ width: "100vw", height: "90vh" }}>
        <ReactFlowProvider>
          <Flow commits={data?.commits || []} />
        </ReactFlowProvider>
      </div> */}
    </main>
  );
}
