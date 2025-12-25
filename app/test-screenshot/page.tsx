import Image from "next/image";

export default function TestScreenshot() {
  const screenshotUrl =
    "https://cdn.dobacklinks.com/screenshots/thumbnails/healthreviewboard-com-1766402532101-thumb.webp";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Screenshot Test</h1>

      <div className="space-y-8">
        {/* Test 1: Direct image tag */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Test 1: Direct img tag</h2>
          <img src={screenshotUrl} alt="Test" className="max-w-md border" />
        </div>

        {/* Test 2: Next.js Image component */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Test 2: Next.js Image component</h2>
          <Image src={screenshotUrl} alt="Test" width={400} height={300} className="border" />
        </div>

        {/* Test 3: Show raw URL */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Test 3: Raw URL</h2>
          <p className="font-mono text-sm break-all">{screenshotUrl}</p>
          <a
            href={screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
}
