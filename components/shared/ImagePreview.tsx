"use client";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

export const ImagePreview = ({ children }: { children: React.ReactNode }) => {
  return <Zoom>{children}</Zoom>;
};
