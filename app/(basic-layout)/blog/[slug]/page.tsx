import { listPublishedPostsAction } from "@/actions/blogs/posts";
import MDXComponents from "@/components/mdx/MDXComponents";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getPostBySlug, getPosts } from "@/lib/getBlogs";
import { constructMetadata } from "@/lib/metadata";
import dayjs from "dayjs";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { ContentRestrictionMessage } from "./ContentRestrictionMessage";

export const dynamicParams = true;

type Params = Promise<{
  slug: string;
}>;

type MetadataProps = {
  params: Params;
};
export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const { post, errorCode } = await getPostBySlug(slug);

  if (!post) {
    return constructMetadata({
      title: "404",
      description: "Page not found",
      noIndex: true,
      path: `/blog/${slug}`,
    });
  }

  const metadataPath = post.slug.startsWith("/") ? post.slug : `/${post.slug}`;
  const fullPath = `/blog${metadataPath}`;

  return constructMetadata({
    title: post.title,
    description: post.description,
    images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    path: fullPath,
    canonicalUrl: fullPath, // Explicit canonical URL
  });
}

export default async function BlogPage({ params }: { params: Params }) {
  const { slug } = await params;

  const { post, errorCode } = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  let showRestrictionMessageInsteadOfContent = false;
  let messageTitle = "";
  let messageContent = "";
  let actionText = "";
  let actionLink = "";

  if (errorCode) {
    showRestrictionMessageInsteadOfContent = true;
    const redirectUrl = `/blog/${slug}`;

    if (errorCode === "unauthorized") {
      messageTitle = "Access Restricted";
      messageContent = "This article is only available to logged-in users";
      actionText = "Sign In";
      actionLink = `/login?next=${encodeURIComponent(redirectUrl)}`;
    }
  }

  const tagsArray = post.tags
    ? post.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    : [];

  const getVisibilityInfo = () => {
    switch (post.visibility) {
      case "subscribers":
      case "logged_in":
        return {
          label: "Members Only",
          bgColor: "bg-blue-600",
        };
      default:
        return {
          label: "Public",
          bgColor: "bg-green-600",
        };
    }
  };

  const visibilityInfo = getVisibilityInfo();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="group">
          <Link href="/blogs" prefetch={false} title="Back to Blog List">
            <ArrowLeftIcon className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Blog List
          </Link>
        </Button>
      </div>

      <header className="mb-12">
        {post.visibility !== "public" && (
          <div
            className={`${visibilityInfo.bgColor} text-white text-xs px-3 py-1 rounded-full inline-flex mb-6`}
          >
            {visibilityInfo.label}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dayjs(post.publishedAt).format("MMMM D, YYYY")}
          </div>

          {post.isPinned && (
            <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md text-xs">
              Featured Post
            </div>
          )}
        </div>

        {post.description && (
          <div className="bg-muted rounded-lg p-6 text-lg mb-8">{post.description}</div>
        )}
      </header>

      {post.featuredImageUrl && (
        <div className="my-10 rounded-xl overflow-hidden shadow-md aspect-video relative">
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover"
          />
        </div>
      )}

      {tagsArray.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {tagsArray.map((tag) => (
            <div
              key={tag}
              className="rounded-full bg-secondary/80 hover:bg-secondary px-3 py-1 text-sm font-medium transition-colors"
            >
              {tag}
            </div>
          ))}
        </div>
      )}

      {/* BlogPosting JSON-LD Schema */}
      <Script
        id="blogposting-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description || "",
            image: post.featuredImageUrl || `${siteConfig.url}/og-image.png`,
            datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
            dateModified: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
            author: {
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.url,
            },
            publisher: {
              "@type": "Organization",
              name: siteConfig.name,
              logo: {
                "@type": "ImageObject",
                url: `${siteConfig.url}/logo.png`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${siteConfig.url}/blog/${slug}`,
            },
            keywords: tagsArray.length > 0 ? tagsArray.join(", ") : undefined,
          }),
        }}
      />

      {showRestrictionMessageInsteadOfContent ? (
        <ContentRestrictionMessage
          title={messageTitle}
          message={messageContent}
          actionText={actionText}
          actionLink={actionLink}
          backText={"Back to Blog List"}
          backLink={`/blog`}
        />
      ) : (
        <article className="prose dark:prose-invert lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-img:shadow-md max-w-none">
          <MDXRemote source={post?.content || ""} components={MDXComponents} />
        </article>
      )}

      <div className="mt-16 pt-8 border-t">
        <Button asChild variant="outline" size="sm">
          <Link
            href="/blogs"
            prefetch={false}
            className="inline-flex items-center"
            title="Back to Blog List"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Blog List
          </Link>
        </Button>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const allParams: { slug: string }[] = [];

  const { posts: localPosts } = await getPosts();
  localPosts
    .filter((post) => post.slug && post.status !== "draft")
    .forEach((post) => {
      const slugPart = post.slug.replace(/^\//, "").replace(/^blogs\//, "");
      if (slugPart) {
        allParams.push({ slug: slugPart });
      }
    });

  const serverResult = await listPublishedPostsAction({
    pageSize: 1000,
    visibility: "public",
  });
  if (serverResult.success && serverResult.data?.posts) {
    serverResult.data.posts.forEach((post) => {
      const slugPart = post.slug?.replace(/^\//, "").replace(/^blogs\//, "");
      if (slugPart) {
        allParams.push({ slug: slugPart });
      }
    });
  }

  const uniqueParams = Array.from(new Map(allParams.map((p) => [p.slug, p])).values());
  return uniqueParams;
}
