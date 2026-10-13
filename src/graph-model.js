export function createKnowledgeGraph({ sources, categories, concepts, relations, routes = [], view }) {
  const errors = [];
  const requireText = (record, field, label) => {
    if (typeof record[field] !== 'string' || record[field].trim() === '') errors.push(`${label} must have a ${field}.`);
  };
  const uniqueIds = (records, label) => {
    const seen = new Set();
    records.forEach(record => {
      requireText(record, 'id', label);
      if (seen.has(record.id)) errors.push(`Duplicate ${label} ID: ${record.id}`);
      seen.add(record.id);
    });
  };

  uniqueIds(sources, 'source');
  uniqueIds(categories, 'category');
  uniqueIds(concepts, 'concept');
  uniqueIds(relations, 'relation');
  uniqueIds(routes, 'route');
  for (const source of sources) {
    ['type', 'title', 'author', 'url', 'publishedAt'].forEach(field => requireText(source, field, `Source ${source.id}`));
    if (source.url && !URL.canParse(source.url)) errors.push(`Source ${source.id} has an invalid URL.`);
  }
  for (const concept of concepts) {
    ['name', 'type', 'categoryId', 'claim', 'summary'].forEach(field => requireText(concept, field, `Concept ${concept.id}`));
    if (!Array.isArray(concept.sources) || concept.sources.length === 0) errors.push(`Concept ${concept.id} needs at least one source.`);
  }
  for (const relation of relations) {
    ['from', 'to', 'type', 'reason'].forEach(field => requireText(relation, field, `Relation ${relation.id}`));
    if (!Array.isArray(relation.evidence) || relation.evidence.length === 0) errors.push(`Relation ${relation.id} needs at least one evidence source.`);
  }
  if (!Array.isArray(view.conceptIds) || view.conceptIds.length === 0) errors.push(`View ${view.id} needs at least one concept.`);
  for (const route of routes) {
    requireText(route, 'name', `Route ${route.id}`);
    requireText(route, 'summary', `Route ${route.id}`);
    if (!Array.isArray(route.conceptIds) || route.conceptIds.length < 2) errors.push(`Route ${route.id} needs at least two concepts.`);
    if (new Set(route.conceptIds ?? []).size !== route.conceptIds?.length) errors.push(`Route ${route.id} cannot repeat a concept.`);
    if (route.movements !== undefined) {
      if (!Array.isArray(route.movements) || route.movements.length === 0) {
        errors.push(`Route ${route.id} movements must be a non-empty array.`);
      } else {
        uniqueIds(route.movements, `movement in route ${route.id}`);
        route.movements.forEach(movement => {
          requireText(movement, 'name', `Movement ${movement.id}`);
          if (!Array.isArray(movement.conceptIds) || movement.conceptIds.length === 0) errors.push(`Movement ${movement.id} needs at least one concept.`);
        });
        const movementConceptIds = route.movements.flatMap(movement => movement.conceptIds ?? []);
        if (movementConceptIds.join('|') !== (route.conceptIds ?? []).join('|')) errors.push(`Route ${route.id} movements must match its concept order.`);
      }
    }
  }

  const sourceById = new Map(sources.map(source => [source.id, source]));
  const categoryById = new Map(categories.map(category => [category.id, category]));
  const conceptById = new Map(concepts.map(concept => [concept.id, concept]));
  const routeById = new Map(routes.map(route => [route.id, route]));
  const visibleIds = new Set(view.conceptIds);
  const visibleConcepts = view.conceptIds.map(id => conceptById.get(id));
  const visibleRelations = relations.filter(relation => visibleIds.has(relation.from) && visibleIds.has(relation.to));

  for (const id of view.conceptIds) if (!conceptById.has(id)) errors.push(`View references missing concept: ${id}`);
  if (view.featuredRouteId && !routeById.has(view.featuredRouteId)) errors.push(`View ${view.id} references missing route: ${view.featuredRouteId}`);
  for (const route of routes) {
    for (const id of route.conceptIds ?? []) {
      if (!visibleIds.has(id)) errors.push(`Route ${route.id} references a concept outside view ${view.id}: ${id}`);
    }
  }
  for (const concept of concepts) {
    if (!categoryById.has(concept.categoryId)) errors.push(`Concept ${concept.id} references missing category: ${concept.categoryId}`);
    for (const sourceId of concept.sources) if (!sourceById.has(sourceId)) errors.push(`Concept ${concept.id} references missing source: ${sourceId}`);
  }
  for (const relation of relations) {
    if (!conceptById.has(relation.from) || !conceptById.has(relation.to)) errors.push(`Relation ${relation.id} has an unknown endpoint.`);
    if (relation.from === relation.to) errors.push(`Relation ${relation.id} cannot connect a concept to itself.`);
    for (const sourceId of relation.evidence) if (!sourceById.has(sourceId)) errors.push(`Relation ${relation.id} references missing evidence: ${sourceId}`);
  }
  if (errors.length) throw new Error(`Knowledge graph validation failed:\n${errors.join('\n')}`);

  const neighborsById = new Map(visibleConcepts.map(concept => [concept.id, []]));
  visibleRelations.forEach(relation => {
    neighborsById.get(relation.from).push({ id: relation.to, relation, direction: 'outgoing' });
    neighborsById.get(relation.to).push({ id: relation.from, relation, direction: 'incoming' });
  });

  return { view, sourceById, categoryById, conceptById, routeById, visibleConcepts, visibleRelations, neighborsById };
}
