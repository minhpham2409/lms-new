import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LumiLearn - Nền tảng học tập thông minh",
    short_name: "LumiLearn",
    description: "Nền tảng học online cho học sinh, giáo viên và phụ huynh tại Việt Nam.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5624d0",
    lang: "vi-VN",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/images/lumilearn_logo_icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/lumilearn_logo_icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
