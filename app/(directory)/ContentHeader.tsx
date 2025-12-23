import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SiDiscord } from "react-icons/si";
import { Last30DaysStats } from "./Last30DaysStats";

interface ContentHeaderProps {
  title: string;
  description: string;
}

export async function ContentHeader({
  title,
  description,
}: ContentHeaderProps) {
  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-col md:flex-row items-start  md:justify-between gap-2">
        <div className="">
          <h1 className="text-md font-semibold leading-tight">{title}</h1>
          <p className="text-muted-foreground leading-relaxed max-w-4xl">
            {description}
          </p>
        </div>

        <Last30DaysStats variant="desktop" />
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="md:w-fit h-10 rounded-xl px-4 my-0 bg-primary text-primary-foreground border-2 border-primary"
          asChild
        >
          <Link href="/submit" className="flex items-center gap-2 my-0">
            <Plus className="w-4 h-4" />
            Submit Site
          </Link>
        </Button>

        {process.env.NEXT_PUBLIC_DISCORD_INVITE_URL && (
          <>
            <Button
              className="md:w-fit h-10 rounded-xl px-4 my-0 bg-white text-primary hover:text-primary/80 border-2 border-primary"
              variant="outline"
              asChild
            >
              <Link
                href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer nofollow"
                title="Join Discord"
                prefetch={false}
                className="flex items-center gap-2 my-0"
              >
                <SiDiscord className="w-4 h-4 text-primary" />
                Join Discord
              </Link>
            </Button>
          </>
        )}
      </div>
      <Last30DaysStats variant="mobile" />
    </div>
  );
}
