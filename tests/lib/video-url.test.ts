import { describe, it, expect } from "vitest";
import { videoKind, youTubeId, toEmbeddableUrl } from "@/lib/video-url";

describe("video-url helpers", () => {
  it("classifies direct files", () => {
    expect(videoKind("https://cdn.example.com/x.mp4")).toBe("file");
    expect(videoKind("https://cdn.example.com/x.webm?token=abc")).toBe("file");
    expect(videoKind("https://cdn.example.com/X.MOV")).toBe("file");
  });

  it("classifies YouTube links", () => {
    expect(videoKind("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
    expect(videoKind("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
    expect(videoKind("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
  });

  it("falls back to other", () => {
    expect(videoKind("https://vimeo.com/12345")).toBe("other");
    expect(videoKind("not a url")).toBe("other");
  });

  it("extracts the YouTube id from every link shape", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ]) {
      expect(youTubeId(url)).toBe("dQw4w9WgXcQ");
    }
    expect(youTubeId("https://vimeo.com/12345")).toBeNull();
  });

  it("toEmbeddableUrl still normalises watch links", () => {
    expect(toEmbeddableUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });
});
