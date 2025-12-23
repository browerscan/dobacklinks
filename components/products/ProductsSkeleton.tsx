import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="space-y-2">
            <div className="flex items-start gap-3">
              {/* Logo skeleton */}
              <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                {/* Name skeleton */}
                <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                {/* Tagline skeleton */}
                <div className="h-4 bg-muted rounded animate-pulse w-full" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Badges skeleton */}
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-8 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>

          <CardFooter>
            {/* Button skeleton */}
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
