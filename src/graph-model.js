export function createKnowledgeGraph({ sources, categories, concepts, relations, view }) {
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

  const sourceById = new Map(sources.map(source => [source.id, source]));
  const categoryById = new Map(categories.map(category => [category.id, category]));
  const conceptById = new Map(concepts.map(concept => [concept.id, concept]));
  const visibleIds = new Set(view.conceptIds);
  const visibleConcepts = view.conceptIds.map(id => conceptById.get(id));
  const visibleRelations = relations.filter(relation => visibleIds.has(relation.from) && visibleIds.has(relation.to));

  for (const id of view.conceptIds) if (!conceptById.has(id)) errors.push(`View references missing concept: ${id}`);
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

  return { view, sourceById, categoryById, conceptById, visibleConcepts, visibleRelations, neighborsById };
}
