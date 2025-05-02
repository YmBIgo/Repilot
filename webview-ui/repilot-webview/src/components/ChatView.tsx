import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { Message } from "../type/Message";
import VscodeButton from "@vscode-elements/react-elements/dist/components/VscodeButton";
import VscodeTextfield from "@vscode-elements/react-elements/dist/components/VscodeTextfield";
import { vscode } from "../utils/vscode";

type ChatViewType = {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setIsSettingsPage: Dispatch<SetStateAction<boolean>>;
};

const initialConfigPrimaryButtons = [
  "Send rootPath",
  "Send rootFunctionName",
  "Send purpose",
];

const ChatView: React.FC<ChatViewType> = ({ messages, setMessages, setIsSettingsPage }) => {
  const [rootPath, setRootPath] = useState<string>("");
  const [rootFunctionName, setRootFunctionName] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [primaryButtonText, setPrimaryButtonText] =
    useState<string>("Send rootPath");
  const [secondaryButtonText, setSecondaryButtonText] =
    useState<string>("Cancel");
  const [inputText, setInputText] = useState<string>("");
  const lastMessage = messages[messages.length - 1];
  const task =
    rootPath && rootFunctionName && purpose
      ? `rootPath : ${rootPath}
rootFunctionName: ${rootFunctionName}
purpose: ${purpose}`
      : "Task not started...";
  const handleSecondaryButtonClick = () => {
    if (primaryButtonText === initialConfigPrimaryButtons[1]) {
      setMessages([
        ...messages,
        {
          type: "say",
          content: "Please input rootPath you want to search.",
          time: Date.now(),
        },
      ]);
      setRootPath("");
      setPrimaryButtonText(initialConfigPrimaryButtons[0]);
      return;
    }
    if (primaryButtonText === initialConfigPrimaryButtons[2]) {
      setMessages([
        ...messages,
        {
          type: "say",
          content: "Please input rootFunctionName you want to search.",
          time: Date.now(),
        },
      ]);
      setRootFunctionName("");
      setPrimaryButtonText(initialConfigPrimaryButtons[1]);
      return;
    }
    if (secondaryButtonText === "Reset") {
      vscode.postMessage({
        type: "Reset"
      });
      setMessages([
        {
          type: "say",
          content: "Please input rootPath you want to search.",
          time: Date.now(),
        },
      ]);
      setRootPath("");
      setRootFunctionName("");
      setPurpose("");
      setPrimaryButtonText(initialConfigPrimaryButtons[0])
      return;
    }
  };
  const handlePrimaryButtonClick = () => {
    if (initialConfigPrimaryButtons.includes(primaryButtonText)) {
      handleSendMessage();
      return;
    }
    if (primaryButtonText === "Start Task") {
      vscode.postMessage(
        {
          type: "Init",
          rootPath,
          rootFunctionName,
          purpose,
        }
      );
      setPrimaryButtonText("")
    }
    if (primaryButtonText === "Response") {
      if (!inputText.trim()) return;
      vscode.postMessage(
        {
          type: "Ask",
          askResponse: inputText.trim(),
        }
      );
      setPrimaryButtonText("");
      setInputText("");
    }
  };
  const handleSendMessage = () => {
    const text = inputText.trim();
    if (text) {
      if (!rootPath) {
        setRootPath(text);
        setInputText("");
        setMessages([
          ...messages,
          {
            type: "say",
            content: "Please input rootFunctionName you want to search.",
            time: Date.now(),
          },
        ]);
        setSecondaryButtonText("Back");
        setPrimaryButtonText(initialConfigPrimaryButtons[1]);
        return;
      }
      if (!rootFunctionName) {
        setRootFunctionName(text);
        setInputText("");
        setMessages([
          ...messages,
          {
            type: "say",
            content: "Please input purpose of your search.",
            time: Date.now(),
          },
        ]);
        setSecondaryButtonText("Back");
        setPrimaryButtonText(initialConfigPrimaryButtons[2]);
        return;
      }
      if (!purpose) {
        setPurpose(text);
        setInputText("");
        setMessages([
          ...messages,
          {
            type: "say",
            content: "Press 'Start Task' button to start task.",
            time: Date.now(),
          },
        ]);
        setSecondaryButtonText("Back");
        setPrimaryButtonText("Start Task");
        return;
      }
    }
  };
  useEffect(() => {
    if (lastMessage.type === "ask") {
      setPrimaryButtonText("Response");
      setSecondaryButtonText("Reset");
      const messagesContainer = document.getElementById("messages");
      messagesContainer?.lastElementChild?.scrollIntoView({block: "end", behavior: "smooth"})
    }
  }, [lastMessage]);
  return (
    <div
      style={{
        width: "350px",
        height: "95vh",
        overflow: "scroll",
        position: "relative",
        borderRight: "1px solid black",
      }}
      id="container"
    >
      <div
        style={{
          border: "3px solid blue",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "10px",
          width: "310px",
          margin: "10px 10px",
          position: "fixed",
          top: "0px",
          left: "0px",
          whiteSpace: "break-spaces",
          overflow: "scroll"
        }}
      >
        <p style={{color: "black", margin: "0"}}>
          {task}
          <hr/>
          If you have not set API KEY, Please set it
          <br/>
          <VscodeButton onClick={() => setIsSettingsPage(true)}>Here</VscodeButton>
        </p>
      </div>
      <div
        id="messages"
        style={{
          width: "310px",
          padding: "10px",
          margin: "50px 0 50px",
          height: "calc(100vh - 220px)",
        }}
      >
        <div
            style={{
            padding: "10px",
            margin: "10px 0",
            height: "50px",
            width: "310px",
          }}
        >
        </div>
        {messages.map((message) =>
          message.type === "ask" || message.type === "say" ? (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                backgroundColor: "white",
                padding: "10px",
                margin: "10px 0",
                whiteSpace: "break-spaces",
                width: "310px",
                color: "black",
                overflow: "scroll",
              }}
            >
              {message.content}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                backgroundColor: "#4cc764",
                color: "white",
                padding: "10px",
                margin: "10px 0",
                whiteSpace: "break-spaces",
                width: "310px",
                overflow: "scroll",
              }}
            >
              {message.content}
            </div>
          )
        )}
        <div
            style={{
            padding: "10px",
            margin: "10px 0",
            height: "100px",
            width: "310px",
          }}
        >
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "10px",
          left: "0px",
          backgroundColor: "#00000070",
          height: "80px",
          width: "350px",
          paddingTop: "10px",
          paddingLeft: "10px"
        }}
      >
        <VscodeTextfield
          value={inputText}
          onChange={(e) => setInputText((e?.target as HTMLTextAreaElement)?.value || "")}
          min={3}
        />
        <br/>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <VscodeButton
            disabled={!secondaryButtonText}
            onClick={handleSecondaryButtonClick}
            secondary
          >
            {secondaryButtonText || "　"}
          </VscodeButton>
          <VscodeButton
            disabled={!primaryButtonText}
            onClick={handlePrimaryButtonClick}
          >
            {primaryButtonText || "　"}
          </VscodeButton>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
