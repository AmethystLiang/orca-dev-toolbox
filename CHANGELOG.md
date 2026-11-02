# Changelog

## Unreleased

- Source, tests and build script moved from `build/` to the repository root; tests split per tool.
- CI builds the panel, checks the committed `panel/index.html` is current, and runs the tests.

## 0.5.0 – 2026-10-31

### Added
- Certificate Decoder: PEM certificates, chains and CSRs. Private keys are refused.
- Image to Base64: drop, pick or paste an image; data URI, CSS, `<img>` and Markdown.
- HTML to JSX, including SVG attributes and inline styles.
- px ↔ rem, with Tailwind spacing steps and whole-stylesheet conversion.
- Password Generator.
- bcrypt & Basic Auth: hash, verify, htpasswd line, `Authorization` header.

## 0.4.0 – 2026-10-31

### Added
- Text Transform: remove accents, slugify, lines to SQL `IN` / JSON array and back, Markdown tables.
- SQL Formatter and XML Formatter, grouped with JSON under Format.
- Size & Duration.
- Character Inspector: hidden characters, look-alike letters, NFC/NFD.

### Changed
- Case Converter can strip accents when building identifiers.

## 0.3.0 – 2026-10-31

### Added
- YAML ↔ JSON, CSV ↔ JSON, JSON to Types (TypeScript, Go, Rust, Python).
- cURL to Code (fetch, requests, HTTPie).
- Subnet / CIDR for IPv4 and IPv6, HTTP Status, QR Code.
- JWT signature check and signing (HS256/384/512); SHA-384; ULID and Nano ID; time zones in Timestamp.

### Fixed
- Pressing Enter in the search box no longer types a line break into the tool it opens.

## 0.2.0 – 2026-10-31

### Added
- Escape, Color, Number Base, Chmod, Text Diff, Case Converter, Line Tools, Text Stats.
- An icon for each tool.

## 0.1.0 – 2026-10-31

First release: JWT, Timestamp, Cron, Base64, URL, UUID, Hash & HMAC, JSON Formatter, Regex Tester.
