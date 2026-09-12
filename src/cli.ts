#!/usr/bin/env node
import * as fs from "fs";
import { parseTree } from "./tree";
import { renderTree } from "./render";

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
  const sources = collectSources(argv.slice(2));

  sources.forEach((source, index) => {
    if (sources.length > 1) {
      if (index > 0) process.stdout.write("\n");
      process.stdout.write(`${source.name ?? "(stdin)"}:\n`);
    }
    const roots = parseTree(source.text);
    process.stdout.write(renderTree(roots) + "\n");
  });
}

main(process.argv);
