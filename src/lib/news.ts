import type { NewsBannerBlock, NewsItem, NewsTextBlock } from "./types";

export type NewsSummary = {
  slug: string;
  createdAt: string;
  image: string;
  imageAlt: string;
  category: string;
  title: string;
  excerpt: string;
};

export function summarizeNews(item: NewsItem): NewsSummary {
  const banner = item.page.blocks.find(
    (block): block is NewsBannerBlock => block.type === "news-banner",
  );
  const text = item.page.blocks.find(
    (block): block is NewsTextBlock => block.type === "news-text",
  );
  if (!banner || !text || (!text.title && !text.text))
    throw new Error(
      `A notícia "${item.slug}" precisa de um banner e um text com título ou conteúdo.`,
    );
  return {
    slug: item.slug,
    createdAt: item.createdAt,
    image: banner.image,
    imageAlt: banner.imageAlt || text.title,
    category: banner.category,
    title: text.title,
    excerpt: text.text
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  };
}

export function formatNewsDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(value))
    .replace(".", "");
}
