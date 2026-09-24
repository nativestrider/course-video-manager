import { describe, it, expect } from "vitest";
import { landscapeVideoEncodeArgs } from "./ffmpeg-run";

const valueOf = (args: string[], flag: string) => args[args.indexOf(flag) + 1];

describe("landscapeVideoEncodeArgs", () => {
  it("encodes with NVENC off macOS, as the Windows/WSL box always has", () => {
    const args = landscapeVideoEncodeArgs("linux");

    expect(valueOf(args, "-c:v")).toBe("h264_nvenc");
    expect(valueOf(args, "-rc:v")).toBe("vbr");
    expect(valueOf(args, "-cq:v")).toBe("19");
  });

  it("encodes with Apple's hardware encoder on macOS, where NVENC does not exist", () => {
    const args = landscapeVideoEncodeArgs("darwin");

    expect(valueOf(args, "-c:v")).toBe("h264_videotoolbox");
    // NVENC-private options make ffmpeg refuse to start without NVENC
    // ("Unrecognized option 'rc:v'").
    expect(args).not.toContain("-rc:v");
    expect(args).not.toContain("-cq:v");
  });

  it("keeps the same bitrate envelope and frame rate on every platform", () => {
    for (const platform of ["darwin", "linux", "win32"] as const) {
      const args = landscapeVideoEncodeArgs(platform);

      expect(valueOf(args, "-b:v")).toBe("15387k");
      expect(valueOf(args, "-maxrate")).toBe("20000k");
      expect(valueOf(args, "-bufsize")).toBe("30000k");
      expect(valueOf(args, "-fps_mode")).toBe("cfr");
      expect(valueOf(args, "-r")).toBe("60");
    }
  });
});
