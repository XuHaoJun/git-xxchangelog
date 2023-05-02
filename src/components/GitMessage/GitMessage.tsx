import { useQuery } from "react-query";

import { open as shellOpen } from "@tauri-apps/api/shell";
import { useTauriLibs, useTauriLibs2 } from "@/hooks/tauri/tauriLibs.hook";
import { Col, Row } from "antd";
import { take } from "rambda";
import styled from "styled-components";

const GitIssueIdSpan = styled.span`
  color: hsl(206, 100%, 40%);
  cursor: crosshair;
`;

function GitIssueId(props: any) {
  const { tauriLibs } = useTauriLibs2();
  // const { isLoading } = useQuery(["test"], () => {
  //   console.log("get_work_item");
  //   return tauriLibs.api.invoke("get_work_item", {
  //     org: "",
  //     id: props.issueId,
  //     project: "",
  //     access_token: "",
  //   });
  // });

  const handleClick = (issueId: string) => () => {
    // shellOpen(
    //   `https://dev.azure.com///_workitems/edit/${issueId}/`
    // );
  };

  return (
    <GitIssueIdSpan onClick={handleClick(props.issueId)}>
      {props.value}
    </GitIssueIdSpan>
  );
}

export function GitMessage({ data, ...others }: any) {
  const { commit, onWheel } = data;
  return (
    <div onWheel={onWheel} className="nowheel nodrag" style={{ width: "90vw" }}>
      <Row justify="start" align="middle">
        <Col span={12}>
          {commit.parsed_title.map((x: any, i: number) => {
            if (x.node_type === "text") {
              return <span key={`${i}`}>{x.value}</span>;
            } else if (x.node_type === "issueId") {
              return (
                <GitIssueId key={`${i}`} issueId={x.issue_id} value={x.value} />
              );
            } else {
              return null;
            }
          })}
        </Col>
        <Col span={12}>
          {commit.author.name}&nbsp;{take(12, commit.oid)}
        </Col>
      </Row>
    </div>
  );
}
