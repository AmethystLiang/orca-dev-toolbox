# Dev Toolbox for Orca

The small tools you reach for every day, in [Orca](https://www.onorca.dev)'s right sidebar.
Everything runs inside Orca's sandboxed panel with no network access, so tokens, secrets and
payloads you paste never leave your machine.

![Dev Toolbox in Orca's sidebar](images/cover.png)

## Tools

| Group | Tool | What it does |
| --- | --- | --- |
| Inspect | **JWT Decoder** | Header and payload of a JSON Web Token, with `exp`, `iat` and `nbf` as local times and whether it has expired. Accepts `Bearer …`. With the secret, checks an HS256, HS384 or HS512 signature; in Sign mode, mints a test token. |
| Inspect | **Timestamp** | Unix seconds, milliseconds, microseconds or nanoseconds (told apart by length), or any date, shown as local time, UTC, ISO 8601, relative time and both Unix forms, plus the time in a zone you pick. |
| Inspect | **Cron** | A five-field cron expression in plain English, with its next five runs. Names (`MON`, `JAN`), ranges, steps and `@daily`-style shortcuts. |
| Inspect | **HTTP Status** | Every registered status code with what it means and when to use it. Search by number, `4xx` or a word. |
| Inspect | **Subnet / CIDR** | Network, netmask, wildcard, host range, broadcast and size of an IPv4 or IPv6 block, its kind (private, loopback…), and whether an address falls inside it. |
| Inspect | **Character Inspector** | Each character's code point and UTF-8 bytes; flags zero-width and other hidden characters, odd spaces, a BOM, Cyrillic or Greek look-alikes among Latin letters, and accents stored decomposed (NFD). Copies a cleaned copy. |
| Encode | **Base64** | Encode UTF-8 text, standard or URL-safe; decode either alphabet, with binary shown as hex. |
| Encode | **URL** | Split a URL into scheme, host, port, path, fragment and decoded query parameters, or percent-encode and decode text. |
| Encode | **Escape** | HTML entities, JSON string literals and Unicode escapes (`\u00e9`, `\u{1F600}`, `U+00E9`), both ways. |
| Convert | **YAML ↔ JSON** | Both ways, multi-document YAML included, with the line and column of any error. |
| Convert | **CSV ↔ JSON** | CSV or TSV (delimiter detected) to an array of objects, numbers and booleans typed; JSON arrays back to CSV. RFC 4180 quoting. |
| Convert | **JSON to Types** | TypeScript interfaces, Go structs, Rust serde structs or Python dataclasses from a sample, with optional and nullable fields inferred across array items. |
| Convert | **cURL to Code** | A curl command, as the browser's “Copy as cURL” gives it, as JavaScript `fetch`, Python `requests` or HTTPie. |
| Convert | **Size & Duration** | `1.5 GB` ↔ bytes, KB and KiB, MB and MiB…; `1h30m`, `90s`, `01:30:00` or `PT1H30M` ↔ milliseconds, seconds, `1h 30m` and ISO 8601. |
| Convert | **Color** | HEX, RGB, HSL and OKLCH from any of them, alpha included, with a picker and WCAG contrast against white and black. |
| Convert | **Number Base** | Decimal, hex, binary and octal of any size, the signed or unsigned reading of the same bits, and the character at that code point. |
| Convert | **Chmod** | `755` ↔ `rwxr-xr-x`, with a permission grid, setuid, setgid and sticky bits, and the mode in plain English. |
| Generate | **UUID & Random** | UUID v4, time-ordered UUID v7 and ULID, Nano ID, and random strings in four alphabets, from the system's secure random generator. Paste a v7 or a ULID to read its creation time. |
| Generate | **Hash & HMAC** | MD5, SHA-1, SHA-256, SHA-384 and SHA-512 of text, in hex or Base64; with a key, the HMAC of each, as webhooks are signed. |
| Generate | **QR Code** | A QR code for a URL or text, such as your dev server's LAN address to open on a phone, with four error-correction levels; copies as SVG. |
| Format | **JSON Formatter** | Validate with the line and column of any error, pretty-print with 2 or 4 spaces or tabs, minify, sort keys. |
| Format | **SQL Formatter** | Queries from logs and ORMs laid out one clause per line, with select lists, AND/OR conditions and subqueries indented; or squeezed onto one line. |
| Format | **XML Formatter** | Pretty-print or minify XML, SVG, plists and POMs, and report where tags fail to nest. |
| Text | **Text Transform** | Remove accents (Vietnamese `đ` included), slugify, lines → comma list, SQL `IN (…)` or JSON array and back, wrap each line, number lines, spreadsheet cells → Markdown table, straight quotes, tabs → spaces, reverse. |
| Text | **Regex Tester** | JavaScript regular expressions with highlighted matches, numbered and named groups, and replacement. |
| Text | **Text Diff** | Two texts compared line by line, changed words marked inside changed lines, unchanged stretches folded. Copies as a unified patch. |
| Text | **Case Converter** | camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case and seven more, line by line, accents removed for identifiers (`Tên người dùng` → `tenNguoiDung`). |
| Text | **Line Tools** | Trim, drop empty lines, remove duplicates, then sort naturally, reverse or shuffle. |
| Text | **Text Stats** | Characters as you see them, words, lines, paragraphs, UTF-8 bytes, UTF-16 length and an LLM token estimate. |

Each tool has its own icon and colour, so it is easy to spot in the list.

## Use

Open the **Dev Toolbox** panel (wrench icon) in the right sidebar.

- **Paste anything into the search box** and the right tool opens with it filled in: a JWT, a
  timestamp or date, JSON, a URL, a cron expression, Base64, a UUID, a colour (`#3b82f6`,
  `rgb(…)`), a prefixed number (`0xff`), a file mode (`rwxr-xr-x`), escaped text (`&lt;`, `\u00e9`), a curl
  command, an IP address or CIDR block, YAML, CSV, a ULID, SQL, XML, a size or duration (`1.5 GB`,
  `1h30m`), or text with hidden characters.
- **Or type** to search tools by name or keyword (`sha256`, `epoch`, `prettify`, `snake`, `dedupe`…); Enter opens
  the first match, ↓ moves through the list.
- **Esc** returns to the list. Each tool keeps what you typed while you switch between them.
- **Copy** buttons sit next to every result.

Requires Orca 1.4.245 or later.

## Develop

Settings → Plugins → **Development folders…** → add this folder. The panel is built from
`build/src`; see [build/README.md](build/README.md) for building, testing and adding a tool.

## Licence

MIT. The panel bundles [js-yaml](https://github.com/nodeca/js-yaml) and
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), both MIT; see
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
