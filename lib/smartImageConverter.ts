import sharp from "sharp";

export const smartImageConverter = async (imageUrl: string) => {
  const isWebpExt = imageUrl.toLowerCase().endsWith(".webp");

  if (!isWebpExt) {
    return imageUrl;
  }

  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    const image = sharp(Buffer.from(buffer));
    const metadata = await image.metadata();

    if (metadata.format === "webp") {
      const pngBuffer = await image.png().toBuffer();
      return `data:image/png;base64,${pngBuffer.toString("base64")}`;
    } else {
      return `data:image/${metadata.format};base64,${Buffer.from(buffer).toString("base64")}`;
    }
  } catch (error) {
    console.error("covert image failed:", error);
    return imageUrl;
  }
};
