"use client";

import Script from "next/script";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;

const PlausibleAnalytics = () => {
  return (
    <>
      {PLAUSIBLE_DOMAIN ? (
        <>
          <Script
            strategy="lazyOnload"
            data-domain={PLAUSIBLE_DOMAIN}
            src={PLAUSIBLE_SRC}
            defer
          />
          <Script
            id="plausible-init"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.plausible = window.plausible || function() {
                  (window.plausible.q = window.plausible.q || []).push(arguments)
                }
              `,
            }}
          />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default PlausibleAnalytics;
