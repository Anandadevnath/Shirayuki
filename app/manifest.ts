import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sode no Shirayuki",
    short_name: "Shirayuki",
    description: "A premium anime streaming experience. Anime, in pure focus.",
    start_url: "/",
    display: "standalone",
    background_color: "#0E1116",
    theme_color: "#0E1116",
  };
}
