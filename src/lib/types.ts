export interface LaunchChecklist {
  before_launch: string[];
  launch_day: string[];
  after_launch: string[];
}

export interface RiskBlocker {
  risk: string;
  impact: string;
  mitigation: string;
}

export interface SuccessMetric {
  metric: string;
  target: string;
  why_it_matters: string;
}

export interface LaunchPack {
  launch_summary: string;
  user_stories: string[];
  launch_checklist: LaunchChecklist;
  risks_and_blockers: RiskBlocker[];
  demo_script: string[];
  release_notes: string[];
  success_metrics: SuccessMetric[];
  feedback_questions: string[];
}

export interface LaunchFormInputs {
  product_name: string;
  description: string;
  audience: string;
  launch_type: 'feature launch' | 'beta launch' | 'internal tool' | 'full product launch';
  timeline: 'today' | 'this week' | 'this month';
  primary_goal: 'activation' | 'adoption' | 'feedback' | 'retention' | 'revenue';
}
