# React Flowcase

React library for creating guided UI flows with animated virtual cursor interactions.

**[Live Demo](https://igbaryya.github.io/react-flowcase/)** · **[npm](https://www.npmjs.com/package/react-flowcase)**

## Install

```bash
npm install react-flowcase
```

## What it does

- Virtual cursor that clicks, types, and navigates through your UI
- Declarative flow steps with cancellation and error handling
- Dev-mode recorder that watches your interactions and generates code
- Drop-in UI components for editing, visualizing, and previewing flows

See the full API documentation in [`react-flowcase/README.md`](./react-flowcase/README.md).

## Repository structure

```
├── react-flowcase/   # The npm library
│   ├── src/          # Source code
│   └── README.md     # Full API documentation
├── demo/             # Interactive demo site
│   └── src/
└── .github/workflows/
    ├── deploy-demo.yml      # Auto-deploy demo to GitHub Pages
    └── publish-library.yml  # Publish to npm on release
```

## Development

```bash
# Install dependencies
npm install

# Start the demo (includes library HMR)
npm run dev -w demo

# Build the library
npm run build -w react-flowcase

# Typecheck everything
npm run typecheck -w react-flowcase
npm run typecheck -w demo
```

## License

MIT
