# proctree-formatter

Process trees get pasted around a lot: into bug reports, chat threads,
postmortems. They almost never come out looking the same twice. `ps -ef
--forest` uses plain space indentation, `pstree` uses unicode box-drawing
characters, the ASCII version of `pstree` uses `|--` and `` `-- ``, and
anyone who retypes a tree by hand mixes tabs and spaces without noticing.
Diffing two of these, or just reading one that's been re-wrapped by an
email client, is more annoying than it should be.

`proctree-fmt` reads any of those shapes and reprints the same tree with
one consistent set of connectors, regardless of how the input was
indented.

## Example

Input (mixed tabs, inconsistent spacing, no connectors):

```
init
	sshd
		bash
	  vim
cron
    anacron
```

```
$ proctree-fmt messy.txt
init
├── sshd
│   ├── bash
│   └── vim
cron
└── anacron
```

It also understands unicode and ASCII `pstree` output on the way in, and
normalizes those to the same canonical form:

```
$ pstree -p | proctree-fmt
```

## Usage

```
proctree-fmt [--json] [file ...]
```

- `--json` prints the parsed forest as a JSON array instead of drawing it.
  Each node has `label`, `pid`, `ppid` and `children`; `pid` and `ppid` are
  `null` when the label carried no annotation. With several files, one JSON
  document is printed per file and the filename headers are omitted.

- With no arguments, or `-`, it reads from stdin.
- With one or more file arguments, it formats each file in turn. If more
  than one file is given, each block of output is labeled with the
  filename it came from.

## How it works

Depth is inferred from indentation the same way an off-side-rule parser
reads Python: each line's leading whitespace (or tree-drawing glyphs,
which are stripped first) is compared to the line above it. A line
indented further than its predecessor starts a new child level; a line
indented the same or less pops back up the stack. This only relies on
indentation *increasing* between a parent and its children, so it holds
up even when the exact indent width isn't consistent across the file.

## Building

```
tsc
node dist/cli.js some-file.txt
```

## Status

Early. The parser now pulls a PID and, where present, a PPID out of each
label's own annotation — `sshd(1234)`, `sshd(1234,1)`, `sshd pid=1234
ppid=1` — but doesn't yet build a tree directly from `ps -ef` style
tabular columns. See the roadmap for what's planned next.
