"use client";
import { useState, useCallback } from "react";

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const DEFAULT: ConfirmState = {
  isOpen: false,
  title: "",
  message: "",
  onConfirm: () => {},
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(DEFAULT);

  const confirm = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title,
          message,
          onConfirm: () => {
            setState(DEFAULT);
            resolve(true);
          },
        });
      });
    },
    []
  );

  const cancel = useCallback(() => {
    setState(DEFAULT);
  }, []);

  return { confirmState: state, confirm, cancelConfirm: cancel };
}
