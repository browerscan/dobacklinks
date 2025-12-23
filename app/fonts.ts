// https://fonts.google.com/

import { Inter, Karla, Pacifico } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const pacifico = Pacifico({
  weight: "400",
  display: "swap",
  preload: false,
});

export const karla = Karla({
  subsets: ["latin"],
  display: "swap",
});
