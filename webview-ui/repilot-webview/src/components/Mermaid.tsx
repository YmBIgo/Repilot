import { VscodeButton } from "@vscode-elements/react-elements";
import mermaid from "mermaid";
import React from "react";

type Props = {
  code: string;
};

export const Mermaid: React.FC<Props> = (props) => {
  const { code } = props;
  const outputRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();

  const render = React.useCallback(async () => {
    if (outputRef.current && code) {
      try {
        // ① 一意な ID を指定する必要あり
        const { svg } = await mermaid.render(id, code);
        outputRef.current.innerHTML = svg;
      } catch (error) {
        console.error(error);
        outputRef.current.innerHTML = "Invalid syntax";
      }
    }
  }, [code]);

  const copyToClipboard = async () => {
    await global.navigator.clipboard.writeText(code);
  };

  React.useEffect(() => {
    render();
  }, [render]);

  return code ? (
    <div style={{ backgroundColor: "#000000" }}>
      <div ref={outputRef} />
      <VscodeButton
        onClick={copyToClipboard}
      >
        Copy Mermaid Content
      </VscodeButton>
    </div>
  ) : null;
};