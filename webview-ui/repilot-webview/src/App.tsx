import { useState } from "react";
import { useEvent } from "react-use";

import { Message } from "./type/Message";
import ChatView from "./components/ChatView";
import SettingView from "./components/SettingView";

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "say",
      content: "Please input rootPath you want to search.",
      time: Date.now(),
    },
  ]);
  const [isSettingsPage, setIsSettingsPage] = useState<boolean>(false)
  useEvent("message", (event: MessageEvent) => {
    const originalMessage =
      typeof event.data === "string" ? event.data : event.data.toString();
    console.log(originalMessage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedMessage: any;
    try {
      if (typeof originalMessage === "string")
        parsedMessage = JSON.parse(originalMessage);
      else if (typeof originalMessage === "object")
        parsedMessage = originalMessage;
      else parsedMessage = JSON.parse(originalMessage);
    } catch (e) {
      console.error(e);
      parsedMessage = {};
    }
    const type = parsedMessage?.type;
    switch (type) {
      case "ask":
        break;
      case "say":
        break;
      case "state":
        setMessages(parsedMessage.state);
        break;
      default:
        break;
    }
  });
  return (
    <div style={{height: "90vh"}}>
      { isSettingsPage
        ? <SettingView setIsSettingsPage={setIsSettingsPage}/>
        : <ChatView setMessages={setMessages} messages={messages} setIsSettingsPage={setIsSettingsPage}/>
      }
    </div>
  );
}

export default App;
