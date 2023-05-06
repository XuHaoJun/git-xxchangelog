import { useQuery } from "react-query";

import { open as shellOpen } from "@tauri-apps/api/shell";
import { useTauriLibs2 } from "@/hooks/tauri/tauriLibs.hook";
import { Col, Row, Tooltip } from "antd";
import { take } from "rambda";
import styled from "styled-components";
import { useRootStore } from "@/stores/root.store";
import { shallow } from "zustand/shallow";
import { useEffect, useState } from "react";

import { Typography } from "antd";

import parse, { Element as HtmlReactElement } from "html-react-parser";
import AzureImage from "../AzureImage/AzureImage";

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
      return tauriLibs.api.invoke("azure_get_work_item", {
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
  useEffect(() => {}, []);
  const renderTitle = () => {
    if (workItem) {
      const descriptionHtml = workItem.fields["System.Description"] as string;
      const parsedDescription = parse(descriptionHtml || "", {
        replace: (domNode) => {
          if (domNode instanceof HtmlReactElement && domNode.name === "img") {
            return (
              <AzureImage
                src={domNode.attribs["src"]}
                alt={domNode.attribs["alt"]}
                width={16 * 30}
                height={9 * 30}
                quality={100}
              />
            );
          } else {
            return domNode;
          }
        },
      });
      return (
        <div style={{ color: "#000000" }}>
          <Title className="sticky top-0 bg-white" level={3}>
            {workItem.fields["System.Title"]}
          </Title>
          {parsedDescription}
        </div>
      );
    } else {
      return <span style={{ color: "#000000" }}>Loading...</span>;
    }
  };

  return (
    <Tooltip
    overlayClassName="shadow-2xl"
      placement="right"
      overlayStyle={{
        maxWidth: "50vw",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
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

export function GitMessage2({ dataSource }: { dataSource: any[] }) {
  return (
    <>
      {dataSource.map((x: any, i: number) => {
        if (x.node_type === "issueId") {
          return (
            <GitIssueId key={`${i}`} issueId={x.issue_id} value={x.value} />
          );
        } else {
          return <span key={`${i}`}>{x.value}</span>;
        }
      })}
    </>
  );
}
