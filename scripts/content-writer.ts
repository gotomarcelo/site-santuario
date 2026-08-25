import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '../src/lib/types';

const pagesDirectory = fileURLToPath(new URL('../src/content/pages/', import.meta.url));
const fragmentsDirectory = fileURLToPath(new URL('../src/content/fragments/', import.meta.url));

async function writeContent(directory: string, entries: Array<{ path: string[]; page: Page }>): Promise<void> {
  await rm(directory, { recursive: true, force: true });

  for (const { path, page } of entries) {
    const destination = join(directory, ...path, 'index.json');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, `${JSON.stringify(page, null, 2)}\n`);
  }
}

export async function writePages(pages: Array<{ path: string[]; page: Page }>): Promise<void> {
  await writeContent(pagesDirectory, pages);
}

export async function writeFragments(fragments: Array<{ path: string[]; page: Page }>): Promise<void> {
  await writeContent(fragmentsDirectory, fragments);
}