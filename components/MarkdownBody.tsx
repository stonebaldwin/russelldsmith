import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { cn } from "@/lib/cn";

/**
 * Renders migrated post bodies as GitHub-flavored Markdown (safe for arbitrary
 * migrated content — no MDX/JSX interpretation of stray {} or <). Heading
 * anchors (rehype-slug) match the TOC ids; internal links use next/link.
 */
export function MarkdownBody({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={cn("article-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
        components={{
          a({ href, children, node, ...props }) {
            void node;
            const url = href ?? "";
            if (url.startsWith("/")) {
              return (
                <Link href={url} {...props}>
                  {children}
                </Link>
              );
            }
            const external = /^https?:\/\//i.test(url);
            return (
              <a
                href={url}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            if (!src || typeof src !== "string") return null;
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" />;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
