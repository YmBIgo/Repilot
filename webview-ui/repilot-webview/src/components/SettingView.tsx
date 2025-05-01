import { VscodeButton, VscodeTextfield } from "@vscode-elements/react-elements";
import { vscode } from "../utils/vscode";
import { Dispatch, SetStateAction, useState } from "react";

type SettingViewProps = {
    setIsSettingsPage: Dispatch<SetStateAction<boolean>>;
}

const SettingView: React.FC<SettingViewProps> = ({
    setIsSettingsPage
}) => {

  const [apiKey, setApiKey] = useState<string>("");
  const updateApiKey = () => {
    vscode.postMessage({
        type: "ApiKey",
        text: apiKey
    });
  };

  const [goplsPath, setGoplsPath] = useState<string>("");
  const updateGoplsPath = () => {
    vscode.postMessage({
        type: "GoplsPath",
        text: goplsPath
    });
  }

  return (
    <div
      style={{
        width: "350px",
        height: "95vh",
        overflow: "scroll",
        position: "relative",
        borderRight: "1px solid black",
      }}
      id="settingsContainer"
    >
        <h3>Settings</h3>
        <hr/>
        <p>Claude API KEY</p>
        <VscodeTextfield
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey((e?.target as HTMLTextAreaElement)?.value ?? "error occurs")}
        />
        <VscodeButton
          onClick={updateApiKey}
        >
            Save API KEY
        </VscodeButton>
        <hr/>
        <p>Gopls Path</p>
        <VscodeTextfield
          value={goplsPath}
          onChange={(e) => setGoplsPath((e?.target as HTMLTextAreaElement)?.value ?? "error occurs")}
        />
        <VscodeButton
          onClick={updateGoplsPath}
        >
            Save Gopls Path
        </VscodeButton>
        <hr/>
        <VscodeButton
            onClick={() => setIsSettingsPage(false)}
            secondary
        >
            Back to ChatView
        </VscodeButton>
    </div>
  );
};

export default SettingView;
