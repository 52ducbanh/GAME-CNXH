import type { GameSnapshot, JobType } from '../../types.js';
import type { MapId } from '../../worldMaps.js';
import type { CollisionState } from '../../collisionGeometry.js';
import type { MissionGuide } from '../../missionGuide.js';
import type { CatalogueContext, InteractionAction } from './interactions.js';
import type { GuideContext } from './guide.js';

export interface QuestDefinition {
  id: string;
  title: string;
  scoreLabel: string;
  maxScore: number;
}

/** An existing timed-task capability composed by a province, never active by default. */
export interface TimedObjectiveDefinition {
  id: string;
  questId: string;
  pointId: string;
  label: string;
  jobType: JobType;
  durationMs: number;
  score: number;
  available(snapshot: GameSnapshot): boolean;
}

export interface NpcBinding {
  pointId: string;
  name: string;
  texture?: string;
  color?: string;
}

export interface ProvinceDefinition {
  id: MapId;
  gameplay: 'public-service' | 'hatinh-rescue';
  quests: readonly QuestDefinition[];
  objectives: readonly TimedObjectiveDefinition[];
  presentation: {
    renderer: 'hanoi' | 'regional';
    npcs: readonly NpcBinding[];
    palms: readonly (readonly [number, number])[];
    waterfall?: readonly [number, number];
    rescueSceneUrl?: string;
  };
}

export interface ProvinceView {
  quests: (QuestDefinition & { score: number; status: string })[];
  activeQuestId: string;
  activeQuestNumber: number;
  totalScore: number;
  guide: MissionGuide;
  minimapUrl: string;
  votingOptions: { id: string; plan: 'FIXED' | 'MOBILE' | 'REPAIR' | 'DETOUR'; color: 'amber' | 'sky' | 'emerald'; title: string; description: string }[];
  markers: { pointId: string; done: boolean; color?: string; size?: number }[];
  visual: {
    world: CollisionState;
    bridgeFrame: number;
    clinics: { fixed: { deployed: boolean; crates: number }; mobileB: { deployed: boolean; crates: number }; mobileC: { deployed: boolean; crates: number } };
    rescue: { sceneAlpha: number; duskAlpha: number; fogAlpha: number };
  };
  results: {
    metrics: { label: string; value: string }[];
    recap: { mission: string; title: string; narrative: string; theoryLesson: string }[];
    bridgeLabel: string;
    bridgePlan: string;
    bridgeRepaired: boolean;
    simulationSummary: string;
  };
}

export interface ProvinceModule {
  definition: ProvinceDefinition;
  interactions(context: CatalogueContext): void;
  describeAction(intent: InteractionAction['intent']): string | undefined;
  guide(context: GuideContext): MissionGuide;
  view(snapshot: GameSnapshot, guide: MissionGuide): ProvinceView;
  worldState(snapshot: GameSnapshot): CollisionState;
}
