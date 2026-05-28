"use client";

import { useCopilotChatConfiguration } from "@copilotkit/react-core/v2";

const ToggleButton = () => {
  const config = useCopilotChatConfiguration();

  if (!config?.setModalOpen) return null;

  const openLabel = config.labels.chatToggleOpenLabel;
  const closeLabel = config.labels.chatToggleCloseLabel;

  return (
    <button onClick={() => config.setModalOpen(!config.isModalOpen)}>
      {config.isModalOpen
        ? typeof closeLabel === "string"
          ? closeLabel
          : "Close chat"
        : typeof openLabel === "string"
          ? openLabel
          : "Open chat"}
    </button>
  );
};

export default ToggleButton;