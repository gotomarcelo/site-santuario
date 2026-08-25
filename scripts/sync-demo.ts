import { readFile } from "node:fs/promises";
import { parseGoogleDocument, type GoogleDocument } from "./google-doc-parser";
import { writeFragments, writePages } from "./content-writer";

const fixtureUrl = new URL("./fixtures/google-doc-demo.json", import.meta.url);
const headerFixtureUrl = new URL(
  "./fixtures/google-doc-header.json",
  import.meta.url,
);
const document = JSON.parse(await readFile(fixtureUrl, "utf8"));
const headerDocument = JSON.parse(await readFile(headerFixtureUrl, "utf8"));

const fragmentReference = (source: GoogleDocument): GoogleDocument => ({
  ...source,
  body: {
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
    ],
  },
});

await writePages([
  { path: [], page: parseGoogleDocument(fragmentReference(document)) },
]);
await writeFragments([
  { path: ["header"], page: parseGoogleDocument(headerDocument) },
]);
console.log("Conteúdo de demonstração sincronizado em src/content/pages/.");
