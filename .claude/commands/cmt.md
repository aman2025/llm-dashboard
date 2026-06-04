---
description: Stage all files and commit the changes
---

Stage all files with `git add -A` and commit. If the user provided context after `/cmt`, use it verbatim as the commit message. Otherwise, derive a concise commit message (Chinese, `scope: 描述` style) from the current session history — summarize what was implemented or changed in this conversation. Do not dispatch a subagent, and do not run `git status`, `git diff`, `git log`, format, or lint.
