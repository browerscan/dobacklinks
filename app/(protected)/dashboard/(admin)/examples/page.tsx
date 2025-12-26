import { db } from "@/lib/db";
import { publishedExamples, products } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { constructMetadata } from "@/lib/metadata";
import { ExternalLink, Plus } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Published Examples",
    description: "Manage published guest post examples for testimonials",
    path: `/dashboard/examples`,
  });
}

export default async function PublishedExamplesPage() {
  // Fetch all published examples with product data
  const examples = await db
    .select({
      id: publishedExamples.id,
      productId: publishedExamples.productId,
      publishedUrl: publishedExamples.publishedUrl,
      clientNiche: publishedExamples.clientNiche,
      publishedDate: publishedExamples.publishedDate,
      notes: publishedExamples.notes,
      createdAt: publishedExamples.createdAt,
      productName: products.name,
      productUrl: products.url,
    })
    .from(publishedExamples)
    .leftJoin(products, eq(publishedExamples.productId, products.id))
    .orderBy(desc(publishedExamples.publishedDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Published Examples</h1>
          <p className="text-sm text-muted-foreground">
            Track successful guest posts for client testimonials and credibility
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/examples/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Example
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Success Cases</CardTitle>
          <CardDescription>
            Published guest posts (admin-only, used for testimonials on service page)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {examples.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No published examples yet</p>
              <Button asChild variant="outline">
                <Link href="/dashboard/examples/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Example
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Published URL</TableHead>
                    <TableHead>Client Niche</TableHead>
                    <TableHead>Published Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examples.map((example) => (
                    <TableRow key={example.id}>
                      <TableCell>
                        <div className="font-medium">{example.productName || "Unknown Site"}</div>
                        {example.productUrl && (
                          <a
                            href={example.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                          >
                            {new URL(example.productUrl).hostname}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={example.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 max-w-[300px] truncate"
                        >
                          {example.publishedUrl}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {example.clientNiche ? (
                          <Badge variant="secondary">{example.clientNiche}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {example.publishedDate
                          ? new Date(example.publishedDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {example.notes || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/examples/${example.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>How to leverage published examples</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Service Page Testimonials</strong>
            <p className="text-muted-foreground">
              Display anonymized success cases on /services to build credibility
            </p>
          </div>
          <div>
            <strong>2. Client Reporting</strong>
            <p className="text-muted-foreground">
              Track all published work for accountability and portfolio building
            </p>
          </div>
          <div>
            <strong>3. Internal Metrics</strong>
            <p className="text-muted-foreground">
              Monitor which sites perform best and success rates by niche
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
