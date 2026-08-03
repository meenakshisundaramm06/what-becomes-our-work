export const relations = [
  { id: 'rel-crossover-agency', from: 'task-crossover', to: 'expanded-agency', type: 'expands', reason: 'Crossing tasks gives people a wider scope of action.', evidence: ['src-openai-task-crossover'] },
  { id: 'rel-agency-automaticity', from: 'expanded-agency', to: 'automaticity', type: 'requires', reason: 'A wider scope needs durable mental models, not just generated output.', evidence: ['src-retrieval-practice'] },
  { id: 'rel-agency-answerability', from: 'expanded-agency', to: 'answerability', type: 'requires', reason: 'A wider scope of action also widens what a person must stand behind.', evidence: ['src-addy-future-engineer'] },
  { id: 'rel-automaticity-debt', from: 'automaticity', to: 'cognitive-debt', type: 'protects-against', reason: 'Accessible foundational knowledge lets a person inspect and adapt the work.', evidence: ['src-retrieval-practice'] },
  { id: 'rel-debt-surrender', from: 'cognitive-debt', to: 'cognitive-surrender', type: 'can-lead-to', reason: 'When understanding is weak, accepting a plausible answer becomes tempting.', evidence: ['src-addy-future-engineer'] },
  { id: 'rel-surrender-answerability', from: 'cognitive-surrender', to: 'answerability', type: 'undermines', reason: 'A person cannot responsibly own an outcome they have not understood.', evidence: ['src-addy-future-engineer'] },
  { id: 'rel-crossover-evidence', from: 'task-crossover', to: 'evidence', type: 'raises-the-need-for', reason: 'When people cross disciplines, evidence is what makes the work reviewable.', evidence: ['src-openai-task-crossover'] },
  { id: 'rel-evidence-answerability', from: 'evidence', to: 'answerability', type: 'enables', reason: 'Evidence lets a human make and defend a production decision.', evidence: ['src-addy-future-engineer'] },
  { id: 'rel-evidence-tax', from: 'evidence', to: 'orchestration-tax', type: 'constrains', reason: 'Evidence avoids the cost of reviewing opaque, unstructured generation.', evidence: ['src-addy-future-engineer'] },
  { id: 'rel-tax-answerability', from: 'orchestration-tax', to: 'answerability', type: 'tests', reason: 'More delegated work requires greater clarity about what is being approved.', evidence: ['src-addy-future-engineer'] },
  { id: 'rel-answerability-discernment', from: 'answerability', to: 'discernment', type: 'develops-into', reason: 'Owning outcomes develops the ability to decide what is not worth doing.', evidence: ['src-addy-future-engineer'] },
  { id: 'rel-discernment-crossover', from: 'discernment', to: 'task-crossover', type: 'directs', reason: 'New capability matters only when directed toward a meaningful problem.', evidence: ['src-addy-future-engineer'] },
  { id: 'rel-automaticity-answerability', from: 'automaticity', to: 'answerability', type: 'supports', reason: 'Understanding frees attention for judgment, context, and trade-offs.', evidence: ['src-retrieval-practice'] },
  { id: 'rel-debt-evidence', from: 'cognitive-debt', to: 'evidence', type: 'is-reduced-by', reason: 'Inspectable evidence exposes what a person does and does not understand.', evidence: ['src-addy-future-engineer'] }
];
