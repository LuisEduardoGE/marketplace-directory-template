# Marketplace Directory Template

A static, mobile-first directory for a food court, market hall or shopping centre:
shops grouped by floor, with search, filters (open/closed, price, category), opening
hours and an optional "order / visit" button per shop.

No build step, no backend — plain HTML/CSS/JS, a CSV for the data, and one config file
for the branding. Host it anywhere static (GitHub Pages works out of the box).

**[Live demo](https://luiseduardoge.github.io/marketplace-directory-template/)** — with fictional sample data.

## Make your own

1. Click **Use this template** on GitHub (or fork / download).
2. Edit **`config.js`** — name, logo, floors, colours, contact, button text and every UI label.
3. Replace **`data/shops.csv`** with your shops (columns below).
4. Put your logo in `assets/` and point `config.logo` at it.
5. Enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

Run locally with any static server, e.g. `python -m http.server` and open
<http://localhost:8000> (opening `index.html` as a file won't load the CSV).

## CSV columns

| Column | Required | Example | Notes |
|---|---|---|---|
| `floor` | yes | `1` | Must match one of `config.floors` |
| `shop_name` | yes | `Pasta Fresca` | |
| `status` | yes | `Open` / `Closed` | |
| `price` | no | `1`–`3` | Shown as `$`–`$$$` |
| `categories` | no | `Italian,Pizza` | Comma-separated; filter list is built from these |
| `rating`, `reviews` | no | `4.5`, `143` | Leave `rating` empty to hide stars |
| `hours` | no | `{"Monday": "10:00 - 22:00"}` | JSON object; day names are translated via `labels.days` |
| `logo_url` | no | `assets/shops/pasta.png` | Empty → generated initials badge |
| `phone` | no | `+00 000 000 000` | |
| `social` | no | `instagram.com/yourshop` | Comma-separated |
| `external_url` | no | `https://…` | Target of the per-shop button |
| `description` | no | free text | Shown in the shop detail view |

## Translating

All text lives in `config.labels`. Portuguese, for example:

```js
labels: {
  search: "Pesquisar", searchTitle: "Pesquisar lojas", searchPlaceholder: "Pesquisar por nome, categoria…",
  noResults: "Nenhum resultado encontrado.", filters: "Filtros", filterTitle: "Filtrar lojas",
  floors: "Pisos", floor: "Piso", status: "Estado", all: "Todos", open: "Aberto", closed: "Fechado",
  price: "Preço", categories: "Categorias", apply: "Aplicar", reset: "Limpar",
  previous: "Anterior", next: "Próximo", page: "Página", of: "de", hours: "Horário",
  contactTitle: "Contacto", contactText: "Precisa de ajuda? Contacte-nos em",
  settingsTitle: "Configurações", settingsText: "Nada para configurar ainda.",
  days: { Monday: "Segunda-feira", Tuesday: "Terça-feira", Wednesday: "Quarta-feira",
          Thursday: "Quinta-feira", Friday: "Sexta-feira", Saturday: "Sábado", Sunday: "Domingo" },
},
```

## Content and trademarks

The sample shops, logo and data are fictional. When you publish a real directory, only use
shop names, logos, photos and ratings you have permission to use — brand logos and
third-party ratings (e.g. from map services) are usually protected.

## Notes

- Every value from the CSV is HTML-escaped and links are limited to `http(s):`/`tel:`, so a
  bad row can't inject script.
- Third-party scripts (PapaParse, Font Awesome) are pinned with Subresource Integrity hashes.

## License

[MIT](LICENSE)
