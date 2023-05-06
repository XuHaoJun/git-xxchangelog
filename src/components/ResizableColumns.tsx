import React, { useState } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ResizeCallbackData } from "react-resizable";
import { Resizable } from "react-resizable";
import styled from "styled-components";

interface DataType {
  key: React.Key;
  date: string;
  amount: number;
  type: string;
  note: string;
}

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

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => {
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

const StyledContainer = styled.div`
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

const App: React.FC = () => {
  const [columns, setColumns] = useState<ColumnsType<DataType>>([
    {
      title: "Date",
      dataIndex: "date",
      width: 200,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 100,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 100,
    },
    {
      title: "Note",
      dataIndex: "note",
      width: 100,
    },
    {
      title: "Action",
      key: "action",
      render: () => <a>Delete</a>,
    },
  ]);
  const data: DataType[] = [
    {
      key: 0,
      date: "2018-02-11",
      amount: 120,
      type: "income",
      note: "transfer",
    },
    {
      key: 1,
      date: "2018-03-11",
      amount: 243,
      type: "income",
      note: "transfer",
    },
    {
      key: 2,
      date: "2018-04-11",
      amount: 98,
      type: "income",
      note: "transfer",
    },
  ];

  const handleResize: Function =
    (index: number) =>
    (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
      const newColumns = [...columns];
      newColumns[index] = {
        ...newColumns[index],
        width: size.width,
      };
      setColumns(newColumns);
    };

  const mergeColumns: ColumnsType<DataType> = columns.map((col, index) => ({
    ...col,
    onHeaderCell: (column: ColumnsType<DataType>[number]) => ({
      width: column.width,
      onResize: handleResize(index) as React.ReactEventHandler<any>,
    }),
  }));

  return (
    <StyledContainer>
      <Table
        bordered
        components={{
          header: {
            cell: ResizableTitle,
          },
        }}
        columns={mergeColumns}
        dataSource={data}
      />
    </StyledContainer>
  );
};

export default App;
