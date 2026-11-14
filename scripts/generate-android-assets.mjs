import sharp from "sharp";
import { mkdir } from "node:fs/promises";

await mkdir("assets", { recursive: true });
const source = "public/icon.svg";
await sharp(source).resize(1024, 1024).png().toFile("assets/icon-only.png");
await sharp(source).resize(2732, 2732, { fit: "contain", background: "#090d18" }).png().toFile("assets/splash.png");
console.log("NEXUS AI Android icon and splash assets generated.");
