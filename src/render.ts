import { ProcNode } from "./tree";

// Emits the forest as a JSON array of nodes, each with label, pid, ppid and
// children. pid/ppid are null when the input carried no annotation, so
// consumers can tell "unknown" apart from a real id.
export function renderJson(roots: ProcNode[]): string {
  return JSON.stringify(roots, ["label", "pid", "ppid", "children"], 2);
}

// Redraws a forest with a single canonical set of connectors, the same
// style the "tree" command uses. Root entries get no connector of their
// own; only their descendants branch off of them.
export function renderTree(roots: ProcNode[]): string {
  const lines: string[] = [];

  const printChildren = (nodes: ProcNode[], prefix: string): void => {
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      const connector = isLast ? "└── " : "├── ";
      lines.push(prefix + connector + node.label);
      printChildren(node.children, prefix + (isLast ? "    " : "│   "));
    });
  };

  for (const root of roots) {
    lines.push(root.label);
    printChildren(root.children, "");
  }

  return lines.join("\n");
}
