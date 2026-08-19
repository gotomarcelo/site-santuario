import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '../src/lib/types';

const pagesDirectory = fileURLToPath(new URL('../src/content/pages/', import.meta.url));

export async function writePages(pages: Array<{ path: string[]; page: Page }>): Promise<void> {
  await rm(pagesDirectory, { recursive: true, force: true });

  for (const { path, page } of pages) {
    const destination = join(pagesDirectory, ...path, 'index.json');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, `${JSON.stringify(page, null, 2)}\n`);
  }
}