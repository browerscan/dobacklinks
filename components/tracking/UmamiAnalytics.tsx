"use client";

import Script from "next/script";

const UmamiAnalytics = () => {
  return (
    <Script
      src="https://umami.expertbeacon.com/script.js"
      data-website-id="5e434d82-88ec-4daa-b226-9531ab99b745"
      strategy="lazyOnload"
      defer
    />
  );
};

export default UmamiAnalytics;
