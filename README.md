# Duolingo-style characters (a Claude skill)

This skill teaches Claude to draw people in Duolingo's flat illustration style, using rules and proportions measured from the vector drawings in Duolingo's own brand guide. It covers:

- shape language;
- body proportions;
- arms, hands and fingers;
- faces and expressions;
- posing and layer order;
- color, including the official palette.

## Install

- **Claude Code:** copy the `duolingo-character-style` folder into `~/.claude/skills/` (every project) or into `.claude/skills/` inside one project.
- **Claude apps (web or desktop):** in Settings, under Capabilities, find Skills and upload `duolingo-character-style.zip`.

Claude loads the skill on its own when you ask for a Duolingo-style character. You can also name it: "use the duolingo-character-style skill".

## Try it

- "Draw an SVG of a boy in a green hoodie giving a thumbs up, Duolingo style."
- "Make a React Native SVG of a tired student at a desk holding her head."
- "Review this character and tell me what breaks the Duolingo style."

## What is inside

- `SKILL.md`: the rules, the proportions table, a checklist and the mistakes to avoid.
- `reference/measurements.md`: the raw numbers and quotes from the guide.
- `reference/kit.mjs`: a small JavaScript kit (Node 18+, no dependencies) that draws two example characters in nine poses.
- `reference/render-sheet.mjs`: a contact sheet of every pose. Run `node reference/render-sheet.mjs out` and open `out/sheet.svg`.

## Note

This is a style guide for drawing original characters. Duolingo's own characters (Duo, Lily and the rest) and its logo are Duolingo's trademarks; the skill tells Claude not to copy them.
