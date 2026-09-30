#!/usr/bin/env node
import * as fs from "fs";
import { parseTree } from "./tree";
import { renderJson, renderTree } from "./render";

interface Source {
  name: string | null;
  text: string;
}

function readStdin(): string {
  return fs.readFileSync(0, "utf8");
}

function collectSources(args: string[]): Source[] {
  if (args.length === 0 || (args.length === 1 && args[0] === "-")) {
    return [{ name: null, text: readStdin() }];
  }

  return args.map((arg) =>
    arg === "-"
      ? { name: null, text: readStdin() }
      : { name: arg, text: fs.readFileSync(arg, "utf8") }
  );
}

function main(argv: string[]): void {
  let json = false;
  const files: string[] = [];
  let optionsDone = false;

  for (const arg of argv.slice(2)) {
    if (!optionsDone && arg === "--") {
      optionsDone = true;
    } else if (!optionsDone && arg === "--json") {
      json = true;
    } else if (!optionsDone && arg.length > 1 && arg.startsWith("-")) {
      process.stderr.write(`proctree-fmt: unknown option ${arg}\n`);
      process.exit(2);
    } else {
      files.push(arg);
    }
  }

  const sources = collectSources(files);

  sources.forEach((source, index) => {
    const roots = parseTree(source.text);

    // Labeled headers would make multi-file output invalid JSON, so in json
    // mode each source is one self-contained document, one per line group,
    // and headers are dropped.
    if (json) {
      process.stdout.write(renderJson(roots) + "\n");
      return;
    }

    if (sources.length > 1) {
      if (index > 0) process.stdout.write("\n");
      process.stdout.write(`${source.name ?? "(stdin)"}:\n`);
    }
    process.stdout.write(renderTree(roots) + "\n");
  });
}

main(process.argv);
