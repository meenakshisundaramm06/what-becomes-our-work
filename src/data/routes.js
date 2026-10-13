const whatBecomesOurWorkMovements = [
  {
    id: 'scope-expands',
    name: 'Our scope expands',
    conceptIds: [
      'task-crossover',
      'expanded-agency',
      'project-scale-compression',
      'demand-elasticity',
      'workflow-skeuomorphism'
    ]
  },
  {
    id: 'understanding-lags-output',
    name: 'Output can grow faster than understanding',
    conceptIds: [
      'learning-output-trade',
      'automaticity',
      'prototype-illusion',
      'cognitive-debt',
      'cognitive-surrender',
      'problem-translation'
    ]
  },
  {
    id: 'verification-problem',
    name: 'Generation creates a verification problem',
    conceptIds: [
      'evidence',
      'verification-bottleneck',
      'orchestration-tax',
      'post-deployment-accountability'
    ]
  },
  {
    id: 'human-answerability',
    name: 'Human value shifts toward answerability',
    conceptIds: [
      'human-preference',
      'answerability',
      'discernment'
    ]
  }
];

export const routes = [
  {
    id: 'what-becomes-our-work',
    name: 'The four movements',
    summary: 'Eighteen connected ideas across expanding scope, understanding, verification, and answerability.',
    movements: whatBecomesOurWorkMovements,
    conceptIds: whatBecomesOurWorkMovements.flatMap(movement => movement.conceptIds)
  }
];
