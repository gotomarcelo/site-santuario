import { readFile } from "node:fs/promises";
import { parseGoogleDocument, type GoogleDocument } from "./google-doc-parser";
import { writeFragments, writeNews, writePages } from "./content-writer";
import type { NewsItem } from "../src/lib/types";

const heroFixtureUrl = new URL(
  "./fixtures/google-doc-hero.json",
  import.meta.url,
);
const headerFixtureUrl = new URL(
  "./fixtures/google-doc-header.json",
  import.meta.url,
);
const footerFixtureUrl = new URL(
  "./fixtures/google-doc-footer.json",
  import.meta.url,
);
const massScheduleFixtureUrl = new URL(
  "./fixtures/google-doc-mass-schedule.json",
  import.meta.url,
);
const heroDocument = JSON.parse(await readFile(heroFixtureUrl, "utf8"));
const headerDocument = JSON.parse(await readFile(headerFixtureUrl, "utf8"));
const footerDocument = JSON.parse(await readFile(footerFixtureUrl, "utf8"));
const massScheduleDocument = JSON.parse(
  await readFile(massScheduleFixtureUrl, "utf8"),
);
const newsFixtureUrl = new URL(
  "./fixtures/google-doc-news.json",
  import.meta.url,
);
const newsDocument = JSON.parse(await readFile(newsFixtureUrl, "utf8"));

const withHeader = (source: GoogleDocument): GoogleDocument => ({
  ...source,
  body: {
    ...(source.body ?? {}),
    content: [
      {
        table: {
          tableRows: [
            {
              tableCells: [
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: "fragment\n" } }],
                      },
                    },
                  ],
                },
              ],
            },
            {
              tableCells: [
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: "header\n" } }],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      ...(source.body?.content ?? []),
      {
        table: {
          tableRows: [
            {
              tableCells: [
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: "fragment\n" } }],
                      },
                    },
                  ],
                },
              ],
            },
            {
              tableCells: [
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: "footer\n" } }],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
  },
});

const homePage = {
  ...parseGoogleDocument(withHeader(heroDocument)),
  blocks: [
    ...parseGoogleDocument(withHeader(heroDocument)).blocks,
    ...parseGoogleDocument(massScheduleDocument).blocks,
    {
      type: "news" as const,
      eyebrow: "Comunicados",
      title: "Últimas Notícias",
      description: "Acompanhe as novidades da comunidade.",
      allLabel: "Ver todas",
      allHref: "/noticias/",
    },
  ],
};

await writePages([
  {
    path: [],
    page: homePage,
  },
]);
await writeFragments([
  { path: ["header"], page: parseGoogleDocument(headerDocument) },
  { path: ["footer"], page: parseGoogleDocument(footerDocument) },
]);
const news: NewsItem[] = Array.from({ length: 10 }, (_, index) => ({
  slug: `noticia-${index + 1}`,
  createdAt: new Date(Date.UTC(2025, 7, 18 - index)).toISOString(),
  page: parseGoogleDocument({
    ...newsDocument,
    title: `Notícia de demonstração ${index + 1}`,
  }),
}));
await writeNews(news);
console.log("Conteúdo de demonstração sincronizado em src/content/pages/.");
