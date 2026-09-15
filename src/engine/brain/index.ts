export type {
  DesignPlan,
  DirectorCue,
  Positioning,
  VisualIntent,
  HeroFamily,
  PatternFamily,
  BackgroundTreatment,
  MotifFamilyId,
  VisualConceptBlock,
} from './DesignPlan'
export { planSummaryTr } from './DesignPlan'
export { createPlan, planGraph, advisePlan } from './DesignDirector'
export { buildDesignGraph } from './DesignGraph'
export type { DesignGraph } from './DesignGraph'
export { styleRule, sectorRisks } from './DesignRules'
export { DESIGN_PRINCIPLES } from './DesignKnowledge'
export { scoreDesign, scoreVisualCraft } from './DesignScore'
export type { DesignScorecard, VisualCraftScorecard } from './DesignScore'
export { critiquePlan } from './CritiqueEngine'
export type { CritiqueReport } from './CritiqueEngine'
export { applyPlanToSystem } from './applyPlan'
export { attachArtDirection, allowedHeroes, allowedPatterns, defaultPattern } from './ArtDirection'
export { visualConceptFor, decorationBudgetOf, conceptRowById, conceptRowFor } from './VisualConcept'
export { composeGrammar } from './CompositionGrammar'
export { repairPlan } from './RepairPlanner'
export { resetArtMemory, lastFamilies, lastForStyle, rememberArt, initDesignMemory } from './DesignMemory'
export {
  ASSET_LANGUAGE_VERSION,
  COMPOSITION_VERSION,
  DESIGN_BRAIN_VERSION,
  VISUAL_LANGUAGE_VERSION,
  captureGenerateDecision,
  decisionLogFor,
  decisionLogsFor,
  initDecisionLog,
  lastDecisionLog,
  outcomeOf,
  resetDecisionLogs,
} from './DesignDecisionLog'
export type { DesignDecisionLog, DesignOutcome, StructuredFeedback, FeedbackType, FeedbackStrength } from './DesignDecisionLog'
export { noteDownload, noteExport, noteFeedback, noteFinalized, noteRating } from './OutcomeTracker'
export { critiqueDesign, critiqueAsFeedback, worstSeverity } from './DesignCritic'
export type { DesignCritique, CritiqueCategory, CritiqueSeverity, CritiqueEvidence } from './DesignCritic'
export {
  DESIGN_KNOWLEDGE_SCHEMA,
  activeKnowledge,
  addManualKnowledge,
  brandScopeKey,
  initDesignKnowledge,
  knowledgeRule,
  knowledgeRuleId,
  knowledgeRules,
  knowledgeVersion,
  knowledgeVersions,
  resetDesignKnowledge,
  rollbackKnowledge,
  transitionKnowledge,
  upsertKnowledgeRule,
} from './DesignKnowledgeStore'
export type {
  DesignKnowledgeRule,
  KnowledgeCondition,
  KnowledgeRecommendation,
  KnowledgeScope,
  KnowledgeScopeLevel,
  KnowledgeState,
  KnowledgeVersionEntry,
} from './DesignKnowledgeStore'
export {
  LEARNING_THRESHOLDS,
  aggregateObservations,
  approveKnowledge,
  deprecateKnowledge,
  deriveKnowledgeCandidates,
  feedbackRecommendation,
  initLearning,
  listObservations,
  observeFeedback,
  observeOutcome,
  patternConfidence,
  resetLearning,
  runLearningCycle,
  validateKnowledge,
} from './LearningEngine'
export type { LearningPattern, Observation } from './LearningEngine'
export { applyKnowledgeToBrief, matchingKnowledge } from './applyKnowledge'
export type { AppliedKnowledge } from './applyKnowledge'
export {
  lookupVocabulary,
  resolveSubProduct,
  detectCrossSectorBleed,
  vocabHeroRequired,
  styleForbiddenPatterns,
} from './SectorVisualVocabulary'
export type { VocabularyRow, SubProductId, BleedFault } from './SectorVisualVocabulary'
