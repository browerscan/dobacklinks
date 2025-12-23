"use client";

import Script from "next/script";

const TOLT_ID = process.env.NEXT_PUBLIC_TOLT_ID;

const ToltScript = () => {
  return (
    <>
      {TOLT_ID && process.env.NODE_ENV === "production" ? (
        <Script
          id="tolt-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
          var toltScript = document.createElement('script');
          toltScript.src = 'https://cdn.tolt.io/tolt.js';
          toltScript.setAttribute('data-tolt', '${TOLT_ID}');
          document.head.appendChild(toltScript);
          `,
          }}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default ToltScript;
