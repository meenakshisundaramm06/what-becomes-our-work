# Field Notes

A source-backed, reusable knowledge graph. The first view is **The Answerable Designer**, prepared for the UX chapter; it is a view into the graph, not a separate presentation format.

## Run it

```bash
npm install
npm run dev
```

Before committing content changes, run:

```bash
npm run validate
npm run build
```

## Content model

The knowledge base is separate from the renderer:

- `src/data/sources.js` — canonical source records.
- `src/data/concepts.js` — named concepts, claims, summaries, tags, and source references.
- `src/data/relations.js` — directed, typed relationships with a reason and supporting evidence.
- `src/data/views.js` — curated subsets of concepts for a talk, topic, or reading path.

Every relation must have two existing concept IDs, a relation type, a human-readable reason, and at least one source ID. Every concept must cite an existing source. `scripts/validate-graph.mjs` enforces those referential-integrity rules.

## Adding knowledge

1. Add the original material once in `sources.js`.
2. Add one concept per distinct, discussable idea in `concepts.js`.
3. Add a typed relation in `relations.js`; avoid unlabelled connections.
4. Include the concept in a view only when it belongs in that path.

The Three.js scene in `src/main.js` derives node positions from the active view. It deliberately does not store visual coordinates in the knowledge records.
