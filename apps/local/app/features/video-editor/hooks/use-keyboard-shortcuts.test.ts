import { describe, it, expect } from "vitest";
import { isToggleLastFrameShortcut } from "./use-keyboard-shortcuts";

const press = (
  key: string,
  modifiers: Partial<{
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
  }> = {}
) => ({ key, metaKey: false, ctrlKey: false, altKey: false, ...modifiers });

describe("isToggleLastFrameShortcut", () => {
  it("toggles on O, with or without Shift", () => {
    expect(isToggleLastFrameShortcut(press("o"))).toBe(true);
    expect(isToggleLastFrameShortcut(press("O"))).toBe(true);
  });

  it("leaves Cmd, Ctrl and Alt combinations to the browser", () => {
    expect(isToggleLastFrameShortcut(press("o", { metaKey: true }))).toBe(
      false
    );
    expect(isToggleLastFrameShortcut(press("o", { ctrlKey: true }))).toBe(
      false
    );
    expect(isToggleLastFrameShortcut(press("o", { altKey: true }))).toBe(false);
  });

  it("ignores every other key", () => {
    expect(isToggleLastFrameShortcut(press("p"))).toBe(false);
    expect(isToggleLastFrameShortcut(press("0"))).toBe(false);
  });
});
