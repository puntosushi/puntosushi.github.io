## Copilot instructions for PuntoSushi POS

This repository is a small static single-page POS UI (no backend). Keep changes minimal, preserve Spanish UI text, and follow the patterns already used in the project.

- **Big picture:** The app is a client-side single-page application served as static files. The UI is defined in `index.html`, styles in `style.css`, assets in `res/`, and behavior in `script.js`.

- **Primary data flow:** UI elements in `index.html` map to JavaScript logic in `script.js`:
  - Sidebar `li` elements use `data-target` to show panels with matching `id` (e.g., `<li data-target="orders">` -> panel `id="orders"`).
  - Product tiles in `#products_panel` have `id` values (e.g., `sushi`, `handroll`) which match keys in `PRODUCT_DATA` in `script.js`.
  - Adding a product calls `openProductDialog(productId, productName)`, which reads `PRODUCT_DATA[productId]` and populates the modal.

- **Where to make common edits:**
  - Add/adjust product types and price lists in `script.js` inside the `PRODUCT_DATA` object.
  - Change visible labels, structure or static templates in `index.html` (panels, stepper, summary markup).
  - Update visuals in `style.css` and image assets under `res/`.

- **Important IDs/Selectors to respect:**
  - `#sidebar`, `#toggle-btn` for navigation behavior.
  - `.activity_panel` panels use `id` values referenced by `data-target` sidebar items.
  - `#products_panel .product_option` elements must have an `id` that exists as a key in `PRODUCT_DATA`.
  - `#product_dialog_overlay`, `#product_dialog`, `#dialog_title`, `#dialog_options` for the modal dialog.
  - `#summary_order_panel ul` and `#order_total_value` are where `addToSummary()` and `updateTotal()` append items and update totals.

- **Localization & currency:** The UI text is Spanish. Prices are integers and formatted with `toLocaleString()` in `script.js`. Preserve that approach instead of injecting formatted strings before numeric ops.

- **Dependencies & external integrations:**
  - Icon library loaded via CDN in `index.html`: `https://unpkg.com/lucide@latest` — do not replace without testing icons.
  - All other files are local; there is no API or server-side logic by default.

- **Debugging tips specific to this repo:**
  - Open `index.html` in the browser (or use a Live Server) and use the DevTools console. Typical problems are mismatched `id`/`data-target` names or missing keys in `PRODUCT_DATA`.
  - Use `console.log` in `openProductDialog()` and `addToSummary()` to inspect runtime values.

- **Code style & small conventions:**
  - Keep UI strings in Spanish unless instructed otherwise.
  - Prices are numbers (CLP-like integer amounts); do arithmetic on raw numbers and format only for display.
  - Minimal DOM structure is relied upon: prefer editing existing elements rather than reworking component structure.

- **Examples (copy-paste safe):**
  - Add a new product type (`script.js`):

    ```js
    PRODUCT_DATA['newitem'] = [ { label: 'x1', price: 2500 } ];
    ```

  - Create a matching tile in `index.html` (inside `#products_panel`):

    ```html
    <div class="product_option" id="newitem">
      <img src="res/newitem.png" alt="newitem">
      <h3>Nuevo</h3>
    </div>
    ```

- **When to ask the repo owner:**
  - If changes require persistent storage, APIs, or user authentication — this repo currently contains no server or API contracts.
  - If currency locales or tax calculations must change — confirm desired regional rules before modifying `updateTotal()` logic.

If anything above is unclear or you want this guidance to be stricter (linting, PR checklists, or test runners), tell me what to add and I will iterate.
