import { desc, relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(), // better-auth
  name: text("name"), // better-auth
  image: text("image"), // better-auth
  role: userRoleEnum("role").default("user").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  referral: text("referral"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const session = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
]);

export const postVisibilityEnum = pgEnum("post_visibility", [
  "public",
  "logged_in",
  "subscribers",
]);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .references(() => user.id, { onDelete: "set null" })
      .notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content"),
    description: text("description"),
    featuredImageUrl: text("featured_image_url"),
    isPinned: boolean("is_pinned").default(false).notNull(),
    status: postStatusEnum("status").default("draft").notNull(),
    visibility: postVisibilityEnum("visibility").default("public").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      slugUnique: unique("posts_slug_unique").on(table.slug),
      authorIdIdx: index("idx_posts_author_id").on(table.authorId),
      statusIdx: index("idx_posts_status").on(table.status),
      visibilityIdx: index("idx_posts_visibility").on(table.visibility),
    };
  },
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      nameIdx: index("idx_tags_name").on(table.name),
    };
  },
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .references(() => posts.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.postId, table.tagId] }),
      postIdIdx: index("idx_post_tags_post_id").on(table.postId),
      tagIdIdx: index("idx_post_tags_tag_id").on(table.tagId),
    };
  },
);

export const pricingModelEnum = pgEnum("pricing_model_enum", [
  "Free",
  "Freemium",
  "Paid",
]);

export const productStatusEnum = pgEnum("product_status_enum", [
  "live",
  "cancelled",
  "expired",
  "pending_payment",
  "pending_review",
]);

export const productSubmissionTypeEnum = pgEnum(
  "product_submission_type_enum",
  ["free", "one_time", "monthly_promotion", "featured", "sponsor"],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    icon: text("icon"),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      activeOrderIdx: index("idx_categories_active_order")
        .on(table.isActive, desc(table.displayOrder))
        .where(sql`${table.isActive} = true`),
    };
  },
);

export type Category = typeof categories.$inferSelect;

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    tagline: text("tagline"),
    description: text("description"),
    logoUrl: text("logo_url"),
    /**
     * Primary website users will want to publish on
     */
    url: text("url").notNull(),

    /**
     * Guest post specific fields
     */
    niche: text("niche"),
    da: integer("da").default(0),
    dr: integer("dr").default(0),
    traffic: text("traffic").default("N/A"),
    linkType: text("link_type").default("dofollow"),
    priceRange: text("price_range"),
    turnaroundTime: text("turnaround_time"),
    contactEmail: text("contact_email"),
    spamScore: integer("spam_score"),
    googleNews: boolean("google_news").default(false),
    maxLinks: integer("max_links"),
    requiredContentSize: integer("required_content_size"),
    sampleUrls: jsonb("sample_urls"),

    /**
     * Additional scraper fields (from adsy.com)
     */
    ahrefsOrganicTraffic: integer("ahrefs_organic_traffic"),
    referralDomains: integer("referral_domains"),
    semrushAS: integer("semrush_as"),
    semrushTotalTraffic: integer("semrush_total_traffic"),
    similarwebTrafficScraper: integer("similarweb_traffic_scraper"),
    language: text("language"),
    completionRate: text("completion_rate"),
    avgLifetimeOfLinks: text("avg_lifetime_of_links"),
    approvedDate: text("approved_date"),
    contentPlacementPrice: numeric("content_placement_price", {
      precision: 10,
      scale: 2,
    }),
    writingPlacementPrice: numeric("writing_placement_price", {
      precision: 10,
      scale: 2,
    }),
    specialTopicPrice: numeric("special_topic_price", {
      precision: 10,
      scale: 2,
    }),

    /**
     * SimilarWeb enrichment fields
     */
    similarwebData: jsonb("similarweb_data"),
    enrichmentStatus: text("enrichment_status", {
      enum: ["pending", "enriched", "failed"],
    }).default("pending"),
    enrichedAt: timestamp("enriched_at", { withTimezone: true }),
    monthlyVisits: integer("monthly_visits"),
    globalRank: integer("global_rank"),
    countryRank: integer("country_rank"),
    bounceRate: numeric("bounce_rate", { precision: 5, scale: 2 }),
    pagesPerVisit: numeric("pages_per_visit", { precision: 4, scale: 2 }),
    avgVisitDuration: integer("avg_visit_duration"),
    trafficSources: jsonb("traffic_sources"),

    /**
     * Screenshot & SEO 元数据字段
     * 使用 Cloudflare Browser Rendering API 捕获
     */
    screenshotThumbnailUrl: text("screenshot_thumbnail_url"),
    screenshotFullUrl: text("screenshot_full_url"),
    screenshotCapturedAt: timestamp("screenshot_captured_at", {
      withTimezone: true,
    }),
    screenshotR2Key: text("screenshot_r2_key"),
    screenshotNextCaptureAt: timestamp("screenshot_next_capture_at", {
      withTimezone: true,
    }),
    screenshotStatus: text("screenshot_status", {
      enum: ["pending", "captured", "failed"],
    }).default("pending"),
    screenshotError: text("screenshot_error"),

    // SEO 元数据
    seoTitle: text("seo_title"),
    seoMetaDescription: text("seo_meta_description"),
    seoOgTitle: text("seo_og_title"),
    seoOgDescription: text("seo_og_description"),
    seoOgImage: text("seo_og_image"),
    seoTwitterCard: text("seo_twitter_card"),
    seoTwitterTitle: text("seo_twitter_title"),
    seoTwitterDescription: text("seo_twitter_description"),
    seoTwitterImage: text("seo_twitter_image"),
    seoFaviconUrl: text("seo_favicon_url"),
    seoCanonicalUrl: text("seo_canonical_url"),
    seoH1: text("seo_h1"),

    status: productStatusEnum("status").default("pending_review").notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    appImages: text("app_images").array(),
    linkRel: text("link_rel"),
    submitType: productSubmissionTypeEnum("submit_type").default("free"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastRenewedAt: timestamp("last_renewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      // Enrichment management indexes
      enrichmentStatusIdx: index("idx_products_enrichment_status").on(
        table.enrichmentStatus,
      ),
      // Screenshot status index
      screenshotStatusIdx: index("idx_products_screenshot_status").on(
        table.screenshotStatus,
      ),
      screenshotCapturedAtIdx: index("idx_products_screenshot_captured_at").on(
        table.screenshotCapturedAt,
      ),
      // Filtering indexes for products
      nicheIdx: index("idx_products_niche").on(table.niche),
      drIdx: index("idx_products_dr").on(table.dr),
      monthlyVisitsIdx: index("idx_products_monthly_visits").on(
        table.monthlyVisits,
      ),
      // Composite indexes for common queries
      statusEnrichmentIdx: index("idx_products_status_enrichment").on(
        table.status,
        table.enrichmentStatus,
      ),
      statusIdx: index("idx_products_status").on(table.status),
      // Featured products index for homepage queries
      featuredStatusIdx: index("idx_products_featured_status").on(
        table.isFeatured,
        table.status,
      ),
    };
  },
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.productId, table.categoryId] }),
    };
  },
);

export const newsletter = pgTable("newsletter", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  subscribed: boolean("subscribed").default(true).notNull(),
  unsubscribeToken: text("unsubscribe_token").unique(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export const publishedExamples = pgTable("published_examples", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  publishedUrl: text("published_url").notNull(),
  clientNiche: text("client_niche"),
  publishedDate: timestamp("published_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "login",
  "logout",
  "export",
  "import",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_audit_logs_user_id").on(table.userId),
    actionIdx: index("idx_audit_logs_action").on(table.action),
    entityTypeIdx: index("idx_audit_logs_entity_type").on(table.entityType),
    createdAtIdx: index("idx_audit_logs_created_at").on(table.createdAt),
  }),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  productCategories: many(productCategories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(user, {
    fields: [products.userId],
    references: [user.id],
  }),
  productCategories: many(productCategories),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);
