import { useEffect } from "react";
import type { videoStateReducer } from "../video-state-reducer";
import { shouldIgnoreKeyboardShortcut } from "./should-ignore-keyboard-shortcut";

/**
 * `O` toggles the last-frame overlay — the previous clip's final frame laid
 * semi-transparent over the live camera, for lining up the next take — the
 * same toggle the Stream Deck sends. Modified presses are left to the browser
 * (Cmd+O and friends).
 */
export function isToggleLastFrameShortcut(
  e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">
): boolean {
  return (
    (e.key === "o" || e.key === "O") && !e.metaKey && !e.ctrlKey && !e.altKey
  );
}

export function useKeyboardShortcuts(
  dispatch: (action: videoStateReducer.Action) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyboardShortcut(e)) {
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (e.repeat) return;
        dispatch({ type: "press-space-bar" });
      } else if (e.key === "Delete") {
        dispatch({ type: "press-delete" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        dispatch({ type: "press-return" });
      } else if (e.key === "ArrowLeft") {
        dispatch({ type: "press-arrow-left" });
      } else if (e.key === "ArrowRight") {
        dispatch({ type: "press-arrow-right" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (e.altKey) {
          dispatch({ type: "press-alt-arrow-up" });
        } else {
          dispatch({ type: "press-arrow-up" });
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (e.altKey) {
          dispatch({ type: "press-alt-arrow-down" });
        } else {
          dispatch({ type: "press-arrow-down" });
        }
      } else if (e.key === "l") {
        dispatch({ type: "press-l" });
      } else if (e.key === "k") {
        dispatch({ type: "press-k" });
      } else if (e.key === "Home") {
        dispatch({ type: "press-home" });
      } else if (e.key === "End") {
        dispatch({ type: "press-end" });
      } else if (e.key === "b" || e.key === "B") {
        dispatch({ type: "pause-toggle-key-pressed" });
      } else if (isToggleLastFrameShortcut(e)) {
        dispatch({ type: "toggle-last-frame-of-video" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch]);
}
