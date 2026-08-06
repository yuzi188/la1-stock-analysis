import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LA1 台股分析室",
    short_name: "LA1",
    description: "台股即時報價、K 線、產業輪動、法人狀態、新聞與 AI 分析的市場情報儀表板。",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#03090b",
    theme_color: "#03090b",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
