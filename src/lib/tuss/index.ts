/**
 * TUSS/CID-10 code registry + pricing seam.
 *
 * Provides a realistic subset of TUSS (Terminologia Unificada da Saúde Suplementar)
 * codes with base prices and payer multipliers. In production, plug a real pricing
 * connector (e.g. Unimed or CBHPM table) by setting TUSS_PROVIDER; absent → this table.
 *
 * Usage:
 *   import { lookupTussPrice, suggestCids, suggestProcs } from '@/lib/tuss';
 */

export interface TussItem {
  code: string;
  description: string;
  basePrice: number; // BRL, ANS reference table 2024
  /** Keywords triggering this procedure in note-based auto-suggestion. */
  keywords: string[];
}

export interface CidItem {
  code: string;
  label: string;
  keywords: string[];
}

/** Realistic subset of the TUSS table (CBHPM 2012 / ANS 2024 reference). */
export const TUSS_TABLE: TussItem[] = [
  { code: '10101012', description: 'Consulta médica em consultório', basePrice: 180, keywords: ['consulta', 'visit', 'consultation', '就诊'] },
  { code: '40901360', description: 'Eletrocardiograma convencional (ECG)', basePrice: 85, keywords: ['ecg', 'eletrocardiograma', 'electrocardiogram', 'cardio', '心电图'] },
  { code: '40304361', description: 'Hemograma completo', basePrice: 32, keywords: ['hemograma', 'hemogram', 'blood count', '全血细胞计数'] },
  { code: '40301190', description: 'Glicemia em jejum', basePrice: 18, keywords: ['glicemia', 'glucose', 'glycémie', '血糖', 'diabetes'] },
  { code: '40301310', description: 'Creatinina sérica', basePrice: 22, keywords: ['creatinina', 'creatinine', 'renal', 'rim', '肾'] },
  { code: '40301250', description: 'Colesterol total', basePrice: 24, keywords: ['colesterol', 'cholesterol', '胆固醇', 'lipid', 'lipídico'] },
  { code: '40301260', description: 'Triglicérides', basePrice: 24, keywords: ['triglicérides', 'triglycerides', '甘油三酯'] },
  { code: '40301050', description: 'TSH (tireotropina)', basePrice: 45, keywords: ['tsh', 'tireóide', 'thyroid', '甲状腺'] },
  { code: '40301060', description: 'T4 livre', basePrice: 45, keywords: ['t4', 'tiroxina', 'thyroxine', '甲状腺素'] },
  { code: '40311352', description: 'Ultrassonografia abdominal total', basePrice: 190, keywords: ['ultrassom', 'ultrassonografia', 'ultrasound', '超声', 'eco'] },
  { code: '40901149', description: 'Holter 24h (Holter monitoramento)', basePrice: 280, keywords: ['holter', 'monitoramento', '动态心电图'] },
  { code: '40601358', description: 'Espirometria', basePrice: 120, keywords: ['espirometria', 'spirometry', 'função pulmonar', '肺功能'] },
  { code: '40906031', description: 'Ecocardiograma transtorácico', basePrice: 320, keywords: ['eco cardio', 'ecocardiograma', 'echocardiogram', '超声心动图'] },
  { code: '40901158', description: 'Teste ergométrico', basePrice: 250, keywords: ['ergométrico', 'esforço', 'stress test', 'esteira', '运动试验'] },
  { code: '40302050', description: 'Glicohemoglobina (HbA1c)', basePrice: 38, keywords: ['hba1c', 'glicohemoglobina', 'hemoglobina glicada', '糖化血红蛋白'] },
  { code: '40307670', description: 'Microalbuminúria', basePrice: 42, keywords: ['microalbuminúria', 'microalbuminuria', 'proteinúria', '微量白蛋白'] },
  { code: '40302234', description: 'Ácido úrico sérico', basePrice: 20, keywords: ['ácido úrico', 'uric acid', 'gota', '尿酸'] },
  { code: '40311108', description: 'Radiografia de tórax (PA + Perfil)', basePrice: 95, keywords: ['raio-x', 'radiografia', 'tórax', 'chest', 'x-ray', '胸片'] },
  { code: '40501500', description: 'Ressonância magnética de crânio', basePrice: 850, keywords: ['ressonância', 'mri', 'rm crânio', '核磁共振', '头颅'] },
  { code: '40601166', description: 'Endoscopia digestiva alta', basePrice: 420, keywords: ['endoscopia', 'endoscopy', 'digestiva', '胃镜'] },
];

/** CID-10 subset for auto-suggestion. */
export const CID_TABLE: CidItem[] = [
  { code: 'I10', label: 'Hipertensão arterial essencial (primária)', keywords: ['hipertensão', 'pressão', 'hypertension', 'pressure', '高血压'] },
  { code: 'E11', label: 'Diabetes mellitus tipo 2', keywords: ['diabetes', 'glicemia', 'insulina', '糖尿病'] },
  { code: 'E78', label: 'Hipercolesterolemia / dislipidemia', keywords: ['colesterol', 'dislipidemia', 'lipídio', 'cholesterol', '高脂血症'] },
  { code: 'J06.9', label: 'Infecção aguda das vias aéreas superiores', keywords: ['gripe', 'resfriado', 'ivas', 'flu', 'cold', '上呼吸道感染'] },
  { code: 'J45', label: 'Asma', keywords: ['asma', 'asthma', 'broncoespasmo', '哮喘'] },
  { code: 'K21', label: 'Doença do refluxo gastroesofágico', keywords: ['refluxo', 'azia', 'gerd', 'reflux', '胃食管反流'] },
  { code: 'M54.5', label: 'Lombalgia', keywords: ['dor nas costas', 'lombalgia', 'back pain', '腰痛'] },
  { code: 'G43', label: 'Enxaqueca', keywords: ['enxaqueca', 'migraine', 'cefaleia', 'headache', '偏头痛'] },
  { code: 'Z00', label: 'Exame médico geral — sem queixas', keywords: ['check-up', 'rotina', 'preventivo', 'checkup', '常规检查'] },
  { code: 'I25', label: 'Doença isquêmica crônica do coração', keywords: ['isquemia', 'coronária', 'angina', 'coronary', '冠心病'] },
  { code: 'N18', label: 'Doença renal crônica', keywords: ['renal crônica', 'drc', 'creatinina', 'kidney', '慢性肾病'] },
  { code: 'F32', label: 'Episódio depressivo', keywords: ['depressão', 'depression', 'tristeza', '抑郁'] },
  { code: 'F41.1', label: 'Transtorno de ansiedade generalizada', keywords: ['ansiedade', 'anxiety', 'pânico', '焦虑'] },
  { code: 'L20', label: 'Dermatite atópica', keywords: ['dermatite', 'eczema', 'atopic', '皮炎'] },
  { code: 'A09', label: 'Gastroenterite aguda (diarreia)', keywords: ['diarreia', 'gastroenterite', 'diarrhea', '腹泻'] },
  { code: 'B34.9', label: 'Infecção viral inespecífica', keywords: ['viral', 'vírus', 'virus', '病毒感染'] },
  { code: 'R51', label: 'Cefaleia', keywords: ['cefaleia', 'dor de cabeça', 'headache', 'céphalée', '头痛'] },
  { code: 'R10.4', label: 'Dor abdominal', keywords: ['dor abdominal', 'abdominal pain', '腹痛'] },
  { code: 'R00', label: 'Palpitações / alteração do ritmo cardíaco', keywords: ['palpitação', 'palpitation', 'arritmia', '心悸'] },
  { code: 'E66', label: 'Obesidade', keywords: ['obesidade', 'obesity', 'sobrepeso', '肥胖'] },
];

/** Per-payer pricing multipliers (ANS-tabulated differences). */
const PAYER_MULTIPLIER: Record<string, number> = {
  Unimed: 1.0,
  'Bradesco Saúde': 1.05,
  SulAmérica: 1.02,
  Amil: 0.98,
  Hapvida: 0.92,
};

/** Look up a TUSS procedure entry by code. */
export function lookupTuss(code: string): TussItem | undefined {
  return TUSS_TABLE.find((t) => t.code === code);
}

/** Look up the price of a TUSS code for a specific payer. */
export function lookupTussPrice(code: string, payer?: string): number {
  const item = lookupTuss(code);
  if (!item) return 180; // conservative fallback
  const multiplier = payer ? (PAYER_MULTIPLIER[payer] ?? 1.0) : 1.0;
  return Math.round(item.basePrice * multiplier * 100) / 100;
}

/** Look up a CID-10 entry by code. */
export function lookupCid(code: string): CidItem | undefined {
  return CID_TABLE.find((c) => c.code === code);
}

/** Suggest CID codes from note text (keyword matching). Max 3 results. */
export function suggestCids(text: string): Array<{ code: string; label: string; confidence: number }> {
  const q = text.toLowerCase();
  return CID_TABLE.filter((c) => c.keywords.some((kw) => q.includes(kw.toLowerCase())))
    .slice(0, 3)
    .map((c, i) => ({ code: c.code, label: c.label, confidence: i === 0 ? 0.91 : 0.72 }));
}

/** Suggest TUSS procedures from note text (keyword matching). Max 4 results. */
export function suggestProcs(text: string): Array<{ code: string; label: string; confidence: number }> {
  const q = text.toLowerCase();
  const hits = TUSS_TABLE.filter((t) => t.keywords.some((kw) => q.includes(kw.toLowerCase())));
  // Always include the consultation code first.
  const consult = TUSS_TABLE.find((t) => t.code === '10101012')!;
  const ordered = [consult, ...hits.filter((t) => t.code !== '10101012')].slice(0, 4);
  return ordered.map((t, i) => ({ code: t.code, label: t.description, confidence: i === 0 ? 0.98 : 0.78 }));
}
