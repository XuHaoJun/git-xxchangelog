import { ReactNode } from "react";

export interface BranchLabelProps {
  length?: number;
  children?: ReactNode;
}

export const BranchLabel = (props: BranchLabelProps) => {
  return (
    <span
      style={{
        display: "flex",
        justifyItems: "start",
        alignItems: "center",
      }}
    >
      {props.children}
      <span style={{ marginLeft: 8, color: "#6956f9", fontWeight: "bold" }}>
        {props.length}
      </span>
    </span>
  );
};

export default BranchLabel;
