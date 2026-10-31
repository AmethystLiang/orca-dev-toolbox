# Building Dev Toolbox

`panel/index.html` is generated: one self-contained file, because Orca's panel frame allows only
inline scripts and styles, with no network, workers or eval.

```sh
cd build
npm ci --ignore-scripts
npm run build   # writes ../panel/index.html
npm test        # unit tests, then the panel in a sandboxed frame with Orca's CSP
```

The panel tests drive headless Chromium through `playwright-core`. If its browser is missing, run
`npx playwright-core install chromium-headless-shell`.

## Layout

```
src/
  panel.js       home screen: search, paste detection, grouped list; opens and keeps tool views
  panel.css      styles, built on Orca's --orca-* design tokens
  registry.js    the list of tools and their groups
  detect.js      recognises a pasted value and names the tool for it
  ui.js          small DOM helpers: fields, segmented buttons, output blocks, copy
  tools/*.js     pure logic, no DOM: tested in Node by test/tools.test.mjs
  views/*.js     one file per tool: its metadata and its UI
```

## Adding a tool

1. Put the logic in `src/tools/<name>.js` as plain functions, and test them in
   `test/tools.test.mjs`.
2. Write `src/views/<id>.js` exporting:

   ```js
   export default {
     id: 'color',                       // unique, used in the DOM and saved as the last tool
     title: 'Color',                    // shown in the list and the header
     group: 'Encode',                   // one of GROUPS in registry.js
     description: 'One line on what it does',
     keywords: ['hex', 'rgb', 'hsl'],   // extra words the search matches
     create() {
       // Build the UI with the helpers in ui.js.
       return { node, focus, fill(value) {} } // fill: a pasted value detect.js sent here
     }
   }
   ```

3. Import it in `src/registry.js` and add it to `TOOLS`.
4. If pasted values of this kind can be recognised, add a check to `src/detect.js` and a case
   to `test/detect.test.mjs`.
5. `npm run build && npm test`. The panel tests open every registered tool and fail on any
   error, CSP violation or horizontal scroll at sidebar width.
