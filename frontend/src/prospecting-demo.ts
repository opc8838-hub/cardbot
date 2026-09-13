export type ProspectStage = 0 | 1 | 2 | 3 | 4 | 5;
export type OutreachStatus = 'awaiting_review' | 'approved' | 'saved_local';

export type ProspectDemoState = {
  stage: ProspectStage;
  selectedId: string;
  outreachStatus: OutreachStatus;
};

export const PROSPECT_STORAGE_KEY = 'cardbot_prospect_demo_v1';

export const prospects = [
  {
    id: 'PROSPECT-001',
    company: 'Aurora Habitat AB',
    countryZh: '瑞典',
    countryEn: 'Sweden',
    website: 'aurora-habitat.example',
    score: 92,
    fitZh: '高匹配',
    fitEn: 'Strong fit',
    signalZh: '新公寓项目进入样板间选型期',
    signalEn: 'A new apartment project has entered sample-room selection',
    reasonZh: '聚焦北欧中高端住宅，有稳定的家居五金采购需求。',
    reasonEn: 'Focuses on mid-to-premium Nordic housing with recurring hardware procurement needs.',
    contact: 'Elin Sjöberg',
    roleZh: '采购与材料负责人',
    roleEn: 'Procurement & Materials Lead',
    email: 'elin.sjoberg@aurora-habitat.example',
    sourceZh: '公司官网团队页 + 展会参展名录',
    sourceEn: 'Company team page + trade-fair exhibitor list',
    angleZh: '用 CB-20 快速样品包切入，对应其样板间时间窗口。',
    angleEn: 'Lead with a fast CB-20 sample kit aligned to the sample-room timing window.'
  },
  {
    id: 'PROSPECT-002',
    company: 'Forma Living GmbH',
    countryZh: '德国',
    countryEn: 'Germany',
    website: 'forma-living.example',
    score: 81,
    fitZh: '可跟进',
    fitEn: 'Worth nurturing',
    signalZh: '正在扩展公寓精装产品线',
    signalEn: 'Expanding its apartment fit-out range'
  },
  {
    id: 'PROSPECT-003',
    company: 'Northline Projects Ltd',
    countryZh: '英国',
    countryEn: 'United Kingdom',
    website: 'northline-projects.example',
    score: 68,
    fitZh: '待补资料',
    fitEn: 'Needs more evidence',
    signalZh: '新项目已公布，采购角色未确认',
    signalEn: 'New project announced; procurement owner not confirmed'
  }
] as const;

export const outreachBody = `Hi Elin,

I noticed Aurora Habitat's new apartment project has entered the sample-room selection stage. We supply the CB-20 hardware range for Nordic residential projects and can prepare a compact sample kit for your review.

If this category is relevant to your current material selection, I can share specifications and sample availability first. Pricing and delivery will be confirmed before any commercial commitment.

Best regards,
Jojo`;

export function freshProspectDemo(): ProspectDemoState {
  return { stage: 0, selectedId: prospects[0].id, outreachStatus: 'awaiting_review' };
}

export function loadProspectDemo(storage: Pick<Storage, 'getItem'>): ProspectDemoState {
  const fallback = freshProspectDemo();
  try {
    const value = JSON.parse(storage.getItem(PROSPECT_STORAGE_KEY) || 'null') as Partial<ProspectDemoState> | null;
    if (!value) return fallback;
    const stage = Number.isInteger(value.stage) && Number(value.stage) >= 0 && Number(value.stage) <= 5 ? Number(value.stage) as ProspectStage : 0;
    const selectedId = prospects.some(item => item.id === value.selectedId) ? String(value.selectedId) : fallback.selectedId;
    const outreachStatus: OutreachStatus = ['awaiting_review', 'approved', 'saved_local'].includes(String(value.outreachStatus))
      ? value.outreachStatus as OutreachStatus
      : 'awaiting_review';
    return { stage, selectedId, outreachStatus };
  } catch {
    return fallback;
  }
}
