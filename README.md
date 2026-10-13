# What becomes our work?

An interactive 3D knowledge graph about one question: *when AI expands what we can do, what becomes our work?*

**[Open the live graph →](https://meenakshisundaramm06.github.io/what-becomes-our-work/)**

The graph argues one idea: our value is not only making more, but being able to understand, judge and stand behind what ships. It holds 18 concepts, linked by 36 typed relations, and every claim points back to a source.

This is a portfolio and reference project. I share it to show how I think about structuring an argument as data, not as a reusable tool.

## Try it

- **Drag** to turn the graph and see its depth.
- **Scroll** to zoom.
- **Select a concept** to read its claim, its summary and its sources.
- **Click a category** in the legend to show or hide it.
- **Follow the guided route.** It walks through the argument in four movements: our scope expands, output can grow faster than understanding, generation creates a verification problem, and human value shifts toward answerability.

## What I wanted to show

**The argument lives in data, not in the picture.** A concept, a source or a link is a record. The 3D scene only draws records. It computes each node's position from the active view and never stores coordinates in the knowledge itself. The guided route is data too: an ordered list of concepts, grouped into movements.

**Every link says why.** A relation has two concept IDs, a type, a plain-language reason and at least one source. An unlabelled line between two ideas does not pass validation.

**The source list is checked, not trusted.** The 12 sources include research reports, a journal paper, videos and posts. A script checks that every concept cites a source that exists and every relation joins two concepts that exist. It runs before every deploy.

## How it is built

| Part | File |
| --- | --- |
| Sources | `src/data/sources.js` |
| Concepts (claim, summary, tags, sources) | `src/data/concepts.js` |
| Typed relations (reason, evidence) | `src/data/relations.js` |
| Categories | `src/data/categories.js` |
| Views (a chosen set of concepts) | `src/data/views.js` |
| Guided routes (an ordered path through a view) | `src/data/routes.js` |
| Graph model (data to nodes and edges) | `src/graph-model.js` |
| Scene and interaction | `src/main.js` |
| Rules for valid data | `scripts/validate-graph.mjs` |

Stack: [Three.js](https://threejs.org) for the scene, [Vite](https://vite.dev) for the build, plain JavaScript, no framework. Each push to `main` validates the data, builds the site and publishes it to GitHub Pages.

## Run it

You need Node.js.

```bash
npm install
npm run dev        # start a local server
npm run validate   # check the graph data
npm run build      # build to dist/
```

To add an idea: add its source once, add the concept, then link it with a typed relation that gives a reason. Add it to a view only if it belongs on that map. `npm run validate` tells you what is missing.

## Note

Shared for reference. No license is attached.
