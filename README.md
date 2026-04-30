# CrossStitcher

A web app for tracking your DMC embroidery floss inventory.

## Features

- Browse the full list of DMC floss colors with color swatches
- Mark each color as **In Stock**, **Low**, or **Unowned**
- Search by DMC number or color name
- Filter by status: All / In Stock / Low / Missing
- Sort numerically or group by color family
- Bulk actions: mark all visible as owned/low/unowned, clear all Low → In Stock, or reset inventory
- Export inventory as CSV or JSON
- Dark mode support
- Inventory saves automatically in your browser

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

## Project Structure

```
src/
  data/
    dmcColors.ts                  # Full DMC color list with hex values
  hooks/
    useInventory.ts               # Inventory state + localStorage persistence
    useDarkMode.ts                # Dark mode toggle with system preference detection
  components/
    FlossItem.tsx                 # Individual color row component
    FlossItem.module.css
  screens/
    FlossListScreen.tsx           # Main inventory screen
    FlossListScreen.module.css
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features.
