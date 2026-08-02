import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getPublishedSlugs,
  getRelatedPosts,
  categoryLabel,
} from "@/lib/content";
import { extractToc } from "@/lib/toc";
import { articleJsonLd, breadcrumbJsonLd, absoluteUrl } from "@/lib/seo";
import { MarkdownBody } from "@/components/MarkdownBody";
import { AuthorByline } from "@/components/AuthorByline";
import { TableOfContents } from "@/components/TableOfContents";
import { RelatedPosts } from "@/components/RelatedPosts";
import { CtaBlock } from "@/components/CtaBlock";
import { Thumb } from "@/components/Thumb";
import { JsonLd } from "@/components/JsonLd";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    return {};
  }
  const url = absoluteUrl(post.url);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: post.canonical || url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: ["Russell D Smith"],
      images: post.hero ? [{ url: absoluteUrl(post.hero) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.hero ? [absoluteUrl(post.hero)] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }
  if (post.draft) notFound();

  const toc = extractToc(post.body);
  const related = getRelatedPosts(post, 3);
  const category = post.categories[0];

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Guides", url: "/blog/" },
    ...(category
      ? [{ name: categoryLabel(category), url: `/blog/category/${category}/` }]
      : []),
    { name: post.title, url: post.url },
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/blog/" className="hover:text-accent">Guides</Link>
          </li>
          {category ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/blog/category/${category}/`} className="hover:text-accent">
                  {categoryLabel(category)}
                </Link>
              </li>
            </>
          ) : null}
        </ol>
      </nav>

      <header className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl leading-[1.12] font-semibold tracking-tight text-ink sm:text-[2.6rem]">
          {post.title}
        </h1>
        {post.description ? (
          <p className="mt-4 text-lg leading-8 text-ink-soft">{post.description}</p>
        ) : null}
        <div className="mt-6 border-t border-line pt-5">
          <AuthorByline
            date={post.date}
            updated={post.updated}
            readingTimeMinutes={post.readingTimeMinutes}
          />
        </div>
      </header>

      {post.hero ? (
        <div className="mx-auto mt-8 max-w-4xl">
          <Thumb
            src={post.hero}
            alt={post.heroAlt || post.title}
            category={category}
            ratio="16/9"
            className="rounded-xl"
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
          />
        </div>
      ) : null}

      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start lg:gap-12">
        <div className="mx-auto max-w-3xl lg:mx-0">
          <MarkdownBody markdown={post.body} />
          {post.recovered ? (
            <p className="mt-10 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
              This guide was reviewed and updated for {new Date().getFullYear()}. Some figures
              (loan limits, fees) change annually — contact Russell for current numbers.
            </p>
          ) : null}
          <CtaBlock className="mt-14" />
        </div>
        <aside className="mt-10 hidden lg:sticky lg:top-24 lg:mt-0 lg:block">
          <TableOfContents items={toc} />
        </aside>
      </div>

      {related.length ? (
        <div className="mx-auto mt-16 max-w-6xl border-t border-line pt-12">
          <RelatedPosts posts={related} />
        </div>
      ) : null}
    </article>
  );
}
