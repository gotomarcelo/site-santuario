import { readFile } from "node:fs/promises";
import { parseGoogleDocument, type GoogleDocument } from "./google-doc-parser";
import { writeFragments, writePages } from "./content-writer";

const heroFixtureUrl = new URL(
  "./fixtures/google-doc-hero.json",
  import.meta.url,
);
const headerFixtureUrl = new URL(
  "./fixtures/google-doc-header.json",
  import.meta.url,
);
const massScheduleFixtureUrl = new URL(
  "./fixtures/google-doc-mass-schedule.json",
  import.meta.url,
);
const heroDocument = JSON.parse(await readFile(heroFixtureUrl, "utf8"));
const headerDocument = JSON.parse(await readFile(headerFixtureUrl, "utf8"));
const massScheduleDocument = JSON.parse(
  await readFile(massScheduleFixtureUrl, "utf8"),
);

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
    ],
  },
});

await writePages([
  {
    path: [],
    page: {
      ...parseGoogleDocument(withHeader(heroDocument)),
      blocks: [
        ...parseGoogleDocument(withHeader(heroDocument)).blocks,
        ...parseGoogleDocument(massScheduleDocument).blocks,
      ],
    },
  },
]);
await writeFragments([
  { path: ["header"], page: parseGoogleDocument(headerDocument) },
]);
console.log("Conteúdo de demonstração sincronizado em src/content/pages/.");
