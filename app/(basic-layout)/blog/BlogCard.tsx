import { BlogPost } from "@/types/blog";
import dayjs from "dayjs";
import { EyeIcon, PinIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BlogCard({ post }: { post: BlogPost }) {
  const getVisibilityInfo = () => {
    switch (post.visibility) {
      case "subscribers":
      case "logged_in":
        return {
          label: "Members",
          icon: <UserIcon className="h-3 w-3" />,
          bgColor: "bg-blue-600/90",
        };
      default:
        return {
          label: "Public",
          icon: <EyeIcon className="h-3 w-3" />,
          bgColor: "bg-green-600/90",
        };
    }
  };

  const visibilityInfo = getVisibilityInfo();

  return (
    <Link
      href={`/blog/${post.slug}`}
      title={post.title}
      prefetch={false}
      className="group block"
    >
      <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-3px]">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={post.featuredImageUrl || "/placeholder.svg"}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute top-3 right-3 flex gap-2">
            {post.isPinned && (
              <div
                className="bg-amber-500/90 text-white rounded-full p-1.5"
                title="Pinned Post"
              >
                <PinIcon className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={`${visibilityInfo.bgColor} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1`}
              title={visibilityInfo.label}
            >
              {visibilityInfo.icon}
              <span className="text-xs">{visibilityInfo.label}</span>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-full">
            {dayjs(post.publishedAt).format("MMM D, YYYY")}
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-lg font-medium line-clamp-1 group-hover:text-primary transition-colors">
            {post.title}
          </h2>

          {post.description && (
            <p className="text-muted-foreground text-sm mt-2 line-clamp-1">
              {post.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
