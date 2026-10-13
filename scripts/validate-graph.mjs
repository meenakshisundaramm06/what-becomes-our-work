import { sources } from '../src/data/sources.js';
import { categories } from '../src/data/categories.js';
import { concepts } from '../src/data/concepts.js';
import { relations } from '../src/data/relations.js';
import { routes } from '../src/data/routes.js';
import { views } from '../src/data/views.js';
import { createKnowledgeGraph } from '../src/graph-model.js';

for (const view of views) createKnowledgeGraph({ sources, categories, concepts, relations, routes, view });
console.log(`Validated ${concepts.length} concepts, ${relations.length} typed relations, ${routes.length} routes, ${sources.length} sources, ${categories.length} categories, and ${views.length} views.`);
