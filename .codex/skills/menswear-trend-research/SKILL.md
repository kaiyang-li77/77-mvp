---
name: menswear-trend-research
description: Use when researching recent high-end menswear trends, old money style, quiet luxury menswear, runway references, designer brand cases, Chinese fashion week references, or generating a design-facing menswear trend report with images and source links.
---

# Menswear Trend Research

Use this skill to research recent high-end menswear references for design teachers, brand designers, and merchandisers. The output should focus on old money style, quiet luxury, light tailoring, premium fabrics, silhouettes, color, styling, details, and commercially translatable menswear ideas.

## Workflow

1. Run the broad crawler for 3 foreign sources and 2 Chinese sources:

```bash
python3 scripts/crawl_menswear_trends.py --days 14 --output-dir outputs
```

2. If the user needs runway images or Vogue references, run the Playwright image crawler:

```bash
.venv/bin/python scripts/crawl_vogue_playwright_images.py --use-system-chrome --output-dir outputs
```

Do not run browser installation on every use. If `.venv` or Playwright is missing, install the Python package once in the working project:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install playwright
```

Prefer `--use-system-chrome` when Google Chrome is installed. Only if system Chrome is unavailable or explicitly undesired, install Playwright-managed Chromium once:

```bash
.venv/bin/python -m playwright install chromium
```

3. Read the generated JSON files first. Use Markdown reports for human preview, but use JSON for model reasoning.

4. Generate a design-facing report using `references/report-template.md`.

5. Prioritize 8-12 strong cases over a long raw link list. Put raw URLs, dates, crawl errors, and technical fields in an appendix.

## Design Evaluation Rules

For each important case, evaluate:

- Old money fit
- Quiet luxury fit
- Silhouette
- Fabric
- Color
- Styling
- Detail
- Commercial product translation
- What not to copy directly

## Default Sources

Foreign:
- Vogue Runway
- GQ
- Hypebeast

Chinese:
- 中国国际时装周
- Ontimeshow

## Output Standard

The final report should be useful to a menswear design teacher. Avoid writing a pure crawler log. Lead with design conclusions, trend tables, case cards, product development suggestions, and image references.
