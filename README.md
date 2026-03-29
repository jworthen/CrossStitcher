# CrossStitcher

A mobile app for tracking your DMC embroidery floss inventory.

## Features

- Browse the full list of DMC floss colors with color swatches
- Mark each color as **In Stock**, **Low**, or **Unowned**
- Search by DMC number or color name
- Filter by status: All / In Stock / Low / Missing
- Inventory saves automatically on your device

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Android Studio](https://developer.android.com/studio) with Android SDK 36

### Install dependencies

```bash
npm install
```

### Run on Android

```bash
npx expo run:android
```

Make sure an Android emulator is running or a device is connected via USB with USB debugging enabled.

## Project Structure

```
src/
  data/
    dmcColors.ts        # Full DMC color list with hex values
  hooks/
    useInventory.ts     # Inventory state + AsyncStorage persistence
  components/
    FlossItem.tsx       # Individual color row component
  screens/
    FlossListScreen.tsx # Main inventory screen
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features.
