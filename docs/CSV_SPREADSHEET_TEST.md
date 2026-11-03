# CSV Spreadsheet Verification

The automated fixture verifies UTF-8 BOM output, metadata, one row per response,
response IDs/timestamps, ordered question-text headings, commas, quotes, embedded
line breaks, Unicode, blank answers and formula neutralization. It does not
replace opening an exported production-shaped file in a spreadsheet application.

## Manual procedure

1. Use a non-production survey containing commas, quotes, a line break, Unicode
   text, duplicate-looking question labels and answers beginning with `=`, `+`,
   `-`, `@`, or leading whitespace followed by one of those characters.
2. Submit at least two synthetic responses, leaving one historical answer blank
   only if such legacy data already exists.
3. From the instructor Results page, choose **Export CSV**.
4. Open the file separately in Microsoft Excel, Apple Numbers and/or LibreOffice
   Calc. Do not enable macros or external content.
5. Confirm one `survey_metadata` row and exactly one `response` row per stored
   response. Confirm response IDs, ISO timestamps, every question heading and
   selected answer.
6. Confirm commas, quotes, line breaks and Unicode stay in their original cells.
   Confirm formula-like values display as text and are not executed.
7. Record application/version, operating system, survey response count, date,
   and pass/fail result below. Never include browser tokens or real student data.

## Execution record

Passed on 2026-11-03 using Microsoft Excel 16.114.1 on macOS with a synthetic,
production-shaped fixture containing a UTF-8 BOM, quoted commas and quotes,
embedded line breaks, a checkmark, Japanese text and a leading-whitespace
formula-like answer. Excel parsed four logical rows (header, metadata and two
responses), retained the question heading and Unicode in their cells, and
reported the formula-like answer as text rather than an executable formula.
No student data or browser token was used. The serializer itself is also
covered by the automated fixture; this manual check validates spreadsheet
import compatibility, not a hosted Supabase export.
