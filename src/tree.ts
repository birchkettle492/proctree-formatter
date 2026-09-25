export interface ProcNode {
  label: string;
  pid: number | null;
  ppid: number | null;
  children: ProcNode[];
}

// Recognizes PID/PPID annotations that tools (or people transcribing their
// output) attach to a process name: pstree -p's "sshd(1234)", a hand-typed
// "sshd pid=1234 ppid=1", or a bracketed "sshd [1234]". The label itself is
// left untouched either way, so this only adds metadata for later use
// (json output, matching nodes across a diff) rather than changing what
// gets rendered.
const PID_THEN_PPID = /\bpid[:=]\s*(\d+)\b(?:.*?\bppid[:=]\s*(\d+)\b)?/i;
const PPID_THEN_PID = /\bppid[:=]\s*(\d+)\b(?:.*?\bpid[:=]\s*(\d+)\b)?/i;
const BRACKETED_IDS = /[([](\d+)(?:\s*[,;]\s*(\d+))?[)\]]\s*$/;

function extractIds(label: string): { pid: number | null; ppid: number | null } {
  const pidFirst = label.match(PID_THEN_PPID);
  if (pidFirst) {
    return {
      pid: Number(pidFirst[1]),
      ppid: pidFirst[2] === undefined ? null : Number(pidFirst[2]),
    };
  }

  const ppidFirst = label.match(PPID_THEN_PID);
  if (ppidFirst) {
    return {
      pid: ppidFirst[2] === undefined ? null : Number(ppidFirst[2]),
      ppid: Number(ppidFirst[1]),
    };
  }

  const bracketed = label.match(BRACKETED_IDS);
  if (bracketed) {
    return {
      pid: Number(bracketed[1]),
      ppid: bracketed[2] === undefined ? null : Number(bracketed[2]),
    };
  }

  return { pid: null, ppid: null };
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

    const node: ProcNode = { label, ...extractIds(label), children: [] };
    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ width, node });
  }

  return roots;
}
