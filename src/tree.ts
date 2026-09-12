export interface ProcNode {
  label: string;
  children: ProcNode[];
}

// Matches one "unit" of indentation gutter at the start of a line: plain
// whitespace, a unicode box-drawing connector, or an ascii pstree connector
// (|--, `--, +--). Deliberately does not match a bare "-", since real
// process labels legitimately start with one (login shells show up as
// "-bash" in `ps -ef` output).
const CONNECTOR =
  /^(?:[ \t]+|│[ \t]*|├─*[ \t]*|└─*[ \t]*|\|-*[ \t]*|`-*[ \t]*|\+-*[ \t]*)/;

function splitIndent(rawLine: string): { width: number; label: string } {
  let rest = rawLine.replace(/\t/g, "    ");
  let width = 0;

  for (;;) {
    const match = rest.match(CONNECTOR);
    if (!match || match[0].length === 0) break;
    width += match[0].length;
    rest = rest.slice(match[0].length);
  }

  return { width, label: rest.trim() };
}

// Parses indentation-based process tree text into a forest. Depth is
// inferred from relative indentation growth (a stack, like the off-side
// rule in Python) rather than an exact column width, so it tolerates
// input that mixes tabs, spaces, and tree-drawing glyphs at different
// widths from line to line.
export function parseTree(text: string): ProcNode[] {
  const roots: ProcNode[] = [];
  const stack: { width: number; node: ProcNode }[] = [];

  for (const rawLine of text.split(/\r\n|\r|\n/)) {
    if (rawLine.trim().length === 0) continue;

    const { width, label } = splitIndent(rawLine);
    if (label.length === 0) continue;

    while (stack.length > 0 && width <= stack[stack.length - 1].width) {
      stack.pop();
    }

    const node: ProcNode = { label, children: [] };
    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ width, node });
  }

  return roots;
}
