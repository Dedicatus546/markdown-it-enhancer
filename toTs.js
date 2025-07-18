import { basename } from "node:path";
import { readdir, rename, stat } from "node:fs/promises";
import { join } from "node:path";

const renameTs = async (path) => {
  const filenameList = await readdir(path);
  for (const filename of filenameList) {
    const filepath = join(path, filename);
    const s = await stat(filepath);
    if (s.isDirectory()) {
      await renameTs(filepath);
      continue;
    }
    await rename(filepath, join(path, basename(filename, ".mjs") + ".ts"));
  }
};

await renameTs(join(".", "lib"));
