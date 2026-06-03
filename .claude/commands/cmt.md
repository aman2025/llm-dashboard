---
description: Stage all files and commit the changes
---

Dispatch the `commit-protocol` subagent via the Agent tool. Pass the user's original intent verbatim as the task prompt; if the user provided context after `/cmt`, include it. If the subagent reports "nothing to commit", relay that to the user and stop.
