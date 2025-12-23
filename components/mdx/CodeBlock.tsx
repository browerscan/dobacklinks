import CopyButton from "@/components/mdx/CopyButton";
import React, { HTMLAttributes } from "react";

type ExtractableNode = React.ReactNode;

const extractTextFromNode = (node: ExtractableNode): string => {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractTextFromNode).join("");
  if (
    React.isValidElement<{ children?: React.ReactNode }>(node) &&
    node.props &&
    "children" in node.props &&
    typeof node.props.children !== "undefined"
  ) {
    return extractTextFromNode(node.props.children);
  }
  return "";
};

interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  children: React.ReactElement<{
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
  }>;
  "data-raw"?: string;
}

const CodeBlock = (allProps: CodeBlockProps) => {
  const {
    children: codeElement,
    className: preClassName,
    "data-raw": rawCode,
    ...restPreAttributes
  } = allProps;

  let codeTextToCopy: string;

  if (typeof rawCode === "string") {
    codeTextToCopy = rawCode.trim();
  } else {
    const codeContent = codeElement.props?.children;
    let codeArray: ExtractableNode[];
    if (!Array.isArray(codeContent)) {
      codeArray = [codeContent];
    } else {
      codeArray = codeContent;
    }
    codeTextToCopy = codeArray.map(extractTextFromNode).join("").trim();
  }

  return (
    <div className="relative group not-prose">
      <CopyButton
        className="absolute top-2.5 right-2.5 z-10 p-1 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-600/70 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 print:hidden"
        text={codeTextToCopy}
      />
      <pre {...restPreAttributes} className={`${preClassName || ""}`.trim()}>
        {codeElement}
      </pre>
    </div>
  );
};

export default CodeBlock;
