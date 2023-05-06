import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TableProps } from "antd";
import { Table, theme } from "antd";
import classNames from "classnames";
import ResizeObserver from "rc-resize-observer";
import { VariableSizeGrid as Grid } from "react-window";
import type { ResizeCallbackData } from "react-resizable";
import { Resizable } from "react-resizable";
import styled from "styled-components";
import type { ColumnsType } from "antd/es/table";
import { isNil, sum, tail, take } from "rambda";
import { GitMessage2 } from "../GitMessage/GitMessage";
import Xarrow from "react-xarrows";
import { useElementSize } from "usehooks-ts";

const ResizableTitle = (
  props: React.HTMLAttributes<any> & {
    onResize: (
      e: React.SyntheticEvent<Element>,
      data: ResizeCallbackData
    ) => void;
    width: number;
  }
) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  console.log("ResizableTitle", props);
  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => {
            console.log("???");
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

const VirtualTable = <RecordType extends object>(
  props: TableProps<RecordType> & {
    onColumnsChange?: (nextColumns: ColumnsType<RecordType>) => void;
  }
) => {
  const { columns, scroll, onColumnsChange } = props;
  const [tableWidth, setTableWidth] = useState(0);
  const { token } = theme.useToken();

  const widthColumnCount = columns!.filter(({ width }) => !width).length;
  const fixedWidthColumns = columns!.filter(({ width }) => !isNil(width));

  const mergedColumns0 = columns!.map((column) => {
    if (column.width) {
      return column;
    }

    return {
      ...column,
      width:
        Math.floor(tableWidth / widthColumnCount) -
        sum(fixedWidthColumns.map((x) => x.width) as number[]),
    };
  });

  // useEffect(() => {
  //   if (!equals(mergedColumns0, columns)) {
  //     onColumnsChange?.(mergedColumns0);
  //   }
  // }, [mergedColumns0]);

  const handleResize: Function =
    (index: number) =>
    (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
      if (onColumnsChange) {
        const nextColumns = [...(mergedColumns0 || [])];
        nextColumns[index] = {
          ...nextColumns[index],
          width: size.width,
        };
        onColumnsChange(nextColumns);
      }
    };
  const mergedColumns: ColumnsType<any> = mergedColumns0.map((col, index) => ({
    ...col,
    onHeaderCell: (column: ColumnsType<any>[number]) => ({
      width: column.width,
      onResize: handleResize(index) as React.ReactEventHandler<any>,
    }),
  }));

  const gridRef = useRef<any>();
  const [connectObject] = useState<any>(() => {
    const obj = {};
    Object.defineProperty(obj, "scrollLeft", {
      get: () => {
        if (gridRef.current) {
          return gridRef.current?.state?.scrollLeft;
        }
        return null;
      },
      set: (scrollLeft: number) => {
        if (gridRef.current) {
          gridRef.current.scrollTo({ scrollLeft });
        }
      },
    });

    return obj;
  });

  const resetVirtualGrid = () => {
    gridRef.current?.resetAfterIndices({
      columnIndex: 0,
      shouldForceUpdate: true,
    });
  };

  useEffect(() => resetVirtualGrid, [tableWidth]);

  useEffect(() => resetVirtualGrid, [columns]);

  const renderVirtualList = (
    rawData: object[],
    { scrollbarSize, ref, onScroll }: any
  ) => {
    ref.current = connectObject;
    const totalHeight = rawData.length * 54;

    const maybeCustomRender = (rowIndex: number, columnIndex: number) => {
      const render = (mergedColumns as any)[columnIndex].render;
      const row = rawData[rowIndex] as any;
      const value = row[(mergedColumns as any)[columnIndex].dataIndex];
      if (render) {
        return render(value, row, rowIndex);
      } else {
        return value;
      }
    };

    return (
      <Grid
        ref={gridRef}
        className="virtual-grid"
        columnCount={mergedColumns.length}
        columnWidth={(index: number) => {
          const { width } = mergedColumns[index];
          return totalHeight > (scroll?.y as number) &&
            index === mergedColumns.length - 1
            ? (width as number) - scrollbarSize - 1
            : (width as number);
        }}
        height={scroll!.y as number}
        rowCount={rawData.length}
        overscanRowCount={2}
        rowHeight={() => 54}
        width={tableWidth}
        onScroll={({ scrollLeft }: { scrollLeft: number }) => {
          onScroll({ scrollLeft });
        }}
      >
        {({
          columnIndex,
          rowIndex,
          style,
        }: {
          columnIndex: number;
          rowIndex: number;
          style: React.CSSProperties;
        }) => (
          <div
            className={classNames("virtual-table-cell", {
              "virtual-table-cell-last":
                columnIndex === mergedColumns.length - 1,
            })}
            style={{
              ...style,
              boxSizing: "border-box",
              padding: token.padding,
              borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
              background: token.colorBgContainer,
            }}
          >
            {maybeCustomRender(rowIndex, columnIndex)}
          </div>
        )}
      </Grid>
    );
  };

  return (
    <ResizeObserver
      onResize={({ width }) => {
        setTableWidth(width);
      }}
    >
      <Table
        {...props}
        className="virtual-table"
        columns={mergedColumns}
        pagination={false}
        components={{
          body: renderVirtualList as any,
          header: {
            cell: ResizableTitle,
          },
        }}
      />
    </ResizeObserver>
  );
};

// Usage

const data = Array.from({ length: 100000 }, (_, key) => ({ key }));

const StyledContainer = styled.div`
  height: 100%;
  width: 100%;

  .virtual-table .ant-table-container:before,
  .virtual-table .ant-table-container:after {
    display: none;
  }

  .react-resizable {
    position: relative;
    background-clip: padding-box;
  }

  .react-resizable-handle {
    position: absolute;
    width: 10px;
    height: 100%;
    bottom: 0;
    right: -5px;
    cursor: col-resize;
  }
`;

const defaultColumns = [
  {
    title: "Branch / Tag",
    width: 300,
    key: "Branch/Tag",
    dataIndex: "branches",
    render: (v: any, { branches, tags }: any) => {
      return (
        <span>
          {branches.map((x: any) => (
            <span key={`branch-${x.oid}`}>{simpleBranchName(x)}</span>
          ))}
          {tags.map((x: any) => (
            <span key={`tag-${x.oid}`}>{x.name}</span>
          ))}
        </span>
      );
    },
  },
  {
    title: "Graph",
    width: 300,
    key: "authorView",
    dataIndex: "authorView",
    render: (v: any, { oid, parsed_title, next_oid }: any) => {
      return (
        <>
          <svg
            style={{ marginLeft: 20 }}
            id={`dot-${oid}`}
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
          >
            <circle cx="9" cy="9" r="9" fill="#797979" />
          </svg>
          {next_oid && document.getElementById(`dot-${next_oid}`) && (
            <Xarrow
              start={`dot-${oid}`}
              end={`dot-${next_oid}`}
              color="#797979"
              showHead={false}
              path="grid"
            />
          )}
        </>
      );
    },
  },
  {
    title: "Message",
    key: "message",
    dataIndex: "message",
    render: (v: any, { parsed_title }: any) => {
      return <GitMessage2 dataSource={parsed_title as any[]} />;
    },
  },
  {
    title: "Author",
    width: 150,
    key: "authorView",
    dataIndex: "authorView",
  },
  // {
  //   title: "Sha",
  //   width: 150,
  //   key: "shortOid",
  //   dataIndex: "shortOid",
  // },
];

const GitTable = (props: { dataSource?: TableProps<any>["dataSource"] }) => {
  const [columns, setColumns] = useState<any>(defaultColumns);

  const dataSource = useMemo(
    () =>
      (props.dataSource || []).map((x) => ({
        ...x,
        key: x.oid,
        authorView: x.author.name,
        shortOid: take(12, x.oid),
      })),
    [props.dataSource]
  );

  const [squareRef, { height }] = useElementSize();
  const tableHeaderHeight = 61;

  return (
    <>
      <StyledContainer ref={squareRef}>
        <VirtualTable
          columns={columns}
          onColumnsChange={setColumns}
          dataSource={dataSource}
          scroll={{ y: height - tableHeaderHeight, x: "100vw" }}
        />
      </StyledContainer>
      {/* {dataSource.map(({ oid, next_oid }: any) => {
        const startDotId = `dot-${oid}`;
        const endDotId = `dot-${next_oid}`;
        if (
          document.getElementById(startDotId) &&
          document.getElementById(endDotId)
        ) {
          console.log("?");
          return (
            <Xarrow
              zIndex={999}
              key={`line-${oid}`}
              start={startDotId}
              end={endDotId}
              color="#797979"
              showHead={false}
              path="grid"
            />
          );
        } else {
          return null;
        }
      })} */}
    </>
  );
};

function simpleBranchName(branch: any) {
  if (branch.branch_type === "remote") {
    return tail(branch.name.split("/")).join("/");
  } else {
    return branch.name;
  }
}

export default GitTable;
