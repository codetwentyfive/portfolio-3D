"use client";

import { useState } from "react";

export type AlertType = "danger" | "success";

export interface AlertState {
  show: boolean;
  text: string;
  type: AlertType;
}

const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    text: "",
    type: "danger",
  });

  const showAlert = ({ text, type = "danger" }: { text: string; type?: AlertType }) =>
    setAlert({
      show: true,
      text,
      type,
    });
  const hideAlert = () =>
    setAlert({
      show: false,
      text: "",
      type: "danger",
    });
  return {
    alert,
    showAlert,
    hideAlert,
  };
};

export default useAlert;
