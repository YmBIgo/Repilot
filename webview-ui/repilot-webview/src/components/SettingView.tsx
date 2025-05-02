import { VscodeButton, VscodeTextfield } from "@vscode-elements/react-elements";
import { vscode } from "../utils/vscode";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

type SettingViewProps = {
    setIsSettingsPage: Dispatch<SetStateAction<boolean>>;
    initGoplPath: string;
    initApiKey: string;
    initReportPath: string;
}

const SettingView: React.FC<SettingViewProps> = ({
    setIsSettingsPage,
    initGoplPath,
    initApiKey,
    initReportPath
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
  };

  const [reportPath, setReportPath] = useState<string>("");
  const updateReportPath = () => {
    vscode.postMessage({
        type: "ReportPath",
        text: reportPath
    });
  };

  useEffect(() => {
    setGoplsPath(initGoplPath);
  }, [initGoplPath]);
  useEffect(() => {
    setApiKey(initApiKey);
  }, [initApiKey])
  useEffect(() => {
    setReportPath(initReportPath);
  }, [initReportPath])

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
        <br/>
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
        <br/>
        <VscodeButton
          onClick={updateGoplsPath}
        >
            Save Gopls Path
        </VscodeButton>
        <hr/>
        <p>Path to Save Report</p>
        <VscodeTextfield
            value={reportPath}
            onChange={(e) => setReportPath((e?.target as HTMLTextAreaElement)?.value ?? "error occurs")}
        />
        <br/>
        <VscodeButton
            onClick={updateReportPath}
        >
            Save Report path
        </VscodeButton>
        <hr/>
        <br/>
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
