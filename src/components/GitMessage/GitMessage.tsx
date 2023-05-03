import { useQuery } from "react-query";

import { open as shellOpen } from "@tauri-apps/api/shell";
import { useTauriLibs, useTauriLibs2 } from "@/hooks/tauri/tauriLibs.hook";
import { Col, Row, Tooltip } from "antd";
import { take } from "rambda";
import styled from "styled-components";
import { useRootStore } from "@/stores/root.store";
import { shallow } from "zustand/shallow";
import { useState } from "react";

import { Typography } from "antd";

const { Title, Paragraph } = Typography;

const GitIssueIdSpan = styled.span`
  color: hsl(206, 100%, 40%);
  cursor: pointer;
`;

function GitIssueId(props: any) {
  const { tauriLibs } = useTauriLibs2();
  const [settings] = useRootStore(
    (rootStore) => rootStore.settings,
    (state) => [state.settings],
    shallow
  );

  const handleClick = (issueId: string) => () => {
    shellOpen(
      `https://dev.azure.com/${settings.azureDevOps.organization}/${settings.azureDevOps.project}/_workitems/edit/${issueId}/`
    );
  };

  const [open, setOpen] = useState<boolean>(false);

  const { isLoading, data: workItem } = useQuery<any>(
    ["get_work_item", props.issueId],
    () => {
      console.log("get_work_item");
      return tauriLibs.api.invoke("get_work_item", {
        accessToken: settings.azureDevOps.accessToken,
        org: settings.azureDevOps.organization,
        id: props.issueId,
        project: settings.azureDevOps.project,
      });
    },
    {
      enabled:
        open &&
        Boolean(settings.azureDevOps.accessToken) &&
        Boolean(settings.azureDevOps.organization) &&
        Boolean(settings.azureDevOps.project),
    }
  );
  const renderTitle = () => {
    if (workItem) {
      const descriptionHtml = workItem.fields["System.Description"] as string;
      // const regexp = /<img\s+[^>]*?src=(['"])(?<src>[^'"]+)\1[^>]*?>/g;
      // console.log(regexp.exec(descriptionHtml));
      // console.log(descriptionHtml.replace(regexp, "fasdjiofjasodifjpaisodjfpasdjfiapsoidfj"))
      // const foo = descriptionHtml.replace(
      //   regexp,
      //   `<img src onerror="fetch('$2',{headers: {Authorization: 'Basic :${settings.azureDevOps.accessToken}'}}).then(r=>r.blob()).then(d=> this.src=window.URL.createObjectURL(d)); "`
      // );
      return (
        <div style={{ color: "#000000" }}>
          <Title level={4}>{workItem.fields["System.Title"]}</Title>
          {/* <Paragraph>{foo}</Paragraph> */}
          <div
            dangerouslySetInnerHTML={{
              __html: descriptionHtml
            }}
          />
        </div>
      );
    } else {
      return <span style={{ color: "#000000" }}>Loading...</span>;
    }
  };

  return (
    <Tooltip
      overlayStyle={{ maxWidth: "50vw" }}
      title={renderTitle()}
      open={open}
      onOpenChange={setOpen}
      color="#ffffff"
    >
      <GitIssueIdSpan onClick={handleClick(props.issueId)}>
        {props.value}
      </GitIssueIdSpan>
    </Tooltip>
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
