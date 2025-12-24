import BuiltWithButton from "@/components/BuiltWithButton";
import { Newsletter } from "@/components/newsletter/Newsletter";
import { TwitterX } from "@/components/social-icons/icons";
import { siteConfig } from "@/config/site";
import { GithubIcon, MailIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SiBluesky, SiDiscord } from "react-icons/si";

interface Link {
  id?: string;
  href: string;
  name: string;
  target?: string;
  rel?: string;
}
interface FooterLink {
  title: string;
  links: Link[];
}

const footerLinks: FooterLink[] = [
  {
    title: "Directory",
    links: [
      {
        id: "browse",
        name: "Browse Sites",
        href: "/",
      },
      {
        id: "categories",
        name: "Categories",
        href: "/categories",
      },
      {
        id: "submit",
        name: "Submit Site",
        href: "/submit",
      },
    ],
  },
  {
    title: "Services",
    links: [
      {
        id: "services",
        name: "Guest Posting Service",
        href: "/services",
      },
      {
        id: "hire",
        name: "Hire Me",
        href: "/services#hire-me",
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        id: "about",
        name: "About",
        href: "/about",
      },
      {
        id: "blog",
        name: "Blog",
        href: "/blog",
      },
    ],
  },
];

export default async function Footer() {
  return (
    <div className="bg-gray-900 text-gray-300">
      <footer className="py-2 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-12 lg:grid-cols-6">
            <div className="w-full flex flex-col sm:flex-row lg:flex-col gap-4 col-span-full md:col-span-2">
              <div className="space-y-4 flex-1">
                <div className="items-center space-x-2 flex">
                  <div className="text-gray-50 text-2xl font-semibold flex items-center gap-2">
                    <Image
                      src="/logo.png"
                      alt={siteConfig.name}
                      width={32}
                      height={32}
                    />
                    {siteConfig.name}
                  </div>
                </div>

                <p className="text-sm p4-4 md:pr-12">{siteConfig.tagLine}</p>

                <div className="flex items-center gap-2">
                  {siteConfig.socialLinks?.github && (
                    <Link
                      href={siteConfig.socialLinks.github}
                      prefetch={false}
                      target="_blank"
                      rel="noreferrer nofollow noopener"
                      aria-label="GitHub"
                      title="View on GitHub"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <GithubIcon className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                  {siteConfig.socialLinks?.bluesky && (
                    <Link
                      href={siteConfig.socialLinks.bluesky}
                      prefetch={false}
                      target="_blank"
                      rel="noreferrer nofollow noopener"
                      aria-label="Blue Sky"
                      title="View on Bluesky"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <SiBluesky className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  )}
                  {siteConfig.socialLinks?.twitter && (
                    <Link
                      href={siteConfig.socialLinks.twitter}
                      prefetch={false}
                      target="_blank"
                      rel="noreferrer nofollow noopener"
                      aria-label="Twitter"
                      title="View on Twitter"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <TwitterX className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  )}
                  {siteConfig.socialLinks?.discord && (
                    <Link
                      href={siteConfig.socialLinks.discord}
                      prefetch={false}
                      target="_blank"
                      rel="noreferrer nofollow noopener"
                      aria-label="Discord"
                      title="Join Discord"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <SiDiscord className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  )}
                  {siteConfig.socialLinks?.email && (
                    <Link
                      href={`mailto:${siteConfig.socialLinks.email}`}
                      prefetch={false}
                      target="_blank"
                      rel="noreferrer nofollow noopener"
                      aria-label="Email"
                      title="Email"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <MailIcon className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {footerLinks.map((section) => (
              <div key={section.title} className="flex-1">
                <div className="text-white text-lg font-semibold mb-4">
                  {section.title}
                </div>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        title={link.name}
                        prefetch={false}
                        className="hover:text-white transition-colors"
                        target={link.target || ""}
                        rel={link.rel || ""}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="w-full flex-1 col-span-full md:col-span-2">
              <Newsletter />
            </div>
          </div>

          <div className="border-t border-gray-800 py-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {siteConfig.name}. All rights
              reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="/privacy-policy"
                title="Privacy Policy"
                prefetch={false}
                className="text-gray-400 hover:text-white text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                title="Terms of Service"
                prefetch={false}
                className="text-gray-400 hover:text-white text-sm"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
