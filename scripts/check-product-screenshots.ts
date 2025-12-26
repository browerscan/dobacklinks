import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../lib/db/index";
import { products } from "../lib/db/schema";
import { like } from "drizzle-orm";

async function checkProduct() {
  const product = await db
    .select({
      id: products.id,
      name: products.name,
      url: products.url,
      appImages: products.appImages,
      screenshotFullUrl: products.screenshotFullUrl,
      screenshotThumbnailUrl: products.screenshotThumbnailUrl,
      screenshotCapturedAt: products.screenshotCapturedAt,
    })
    .from(products)
    .where(like(products.url, "%healthreviewboard%"))
    .limit(1);

  console.log(JSON.stringify(product, null, 2));
}

checkProduct().catch(console.error);
