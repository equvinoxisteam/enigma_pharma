export const SERVICE_CATEGORIES = [
  'API_MANUFACTURING', 'API_INTERMEDIATES', 'FORMULATION_DEVELOPMENT', 'CLINICAL_TRIAL_MFG',
  'COMMERCIAL_CDMO', 'BIOLOGICS_BIOSIMILARS', 'HPAPI_ONCOLOGY', 'PACKAGING_LABELING',
  'ANALYTICAL_QC', 'STABILITY_STUDIES', 'REGULATORY_CMC', 'EXCIPIENTS', 'FILL_FINISH',
  'TECH_TRANSFER', 'OTHER'
];

export const SERVICE_CATEGORY_LABELS = {
  API_MANUFACTURING: 'API Manufacturing',
  API_INTERMEDIATES: 'API Intermediates / KSM',
  FORMULATION_DEVELOPMENT: 'Formulation Development',
  CLINICAL_TRIAL_MFG: 'Clinical Trial Manufacturing',
  COMMERCIAL_CDMO: 'Commercial CDMO',
  BIOLOGICS_BIOSIMILARS: 'Biologics / Biosimilars',
  HPAPI_ONCOLOGY: 'HPAPI / Oncology Suites',
  PACKAGING_LABELING: 'Packaging & Labeling',
  ANALYTICAL_QC: 'Analytical / QC Services',
  STABILITY_STUDIES: 'Stability Studies',
  REGULATORY_CMC: 'Regulatory / CMC Support',
  EXCIPIENTS: 'Excipients Sourcing',
  FILL_FINISH: 'Fill-Finish (vials, syringes)',
  TECH_TRANSFER: 'Tech Transfer',
  OTHER: 'Other'
};

export const DEVELOPMENT_PHASES = ['PRECLINICAL', 'PHASE_I', 'PHASE_II', 'PHASE_III', 'COMMERCIAL', 'OTHER'];
export const DEVELOPMENT_PHASE_LABELS = {
  PRECLINICAL: 'Preclinical', PHASE_I: 'Phase I', PHASE_II: 'Phase II',
  PHASE_III: 'Phase III', COMMERCIAL: 'Commercial', OTHER: 'Other'
};

export const GMP_CERTIFICATIONS = ['WHO_GMP', 'US_FDA_CGMP', 'EU_GMP', 'ISO_13485', 'PIC_S', 'ISO_9001', 'OTHER'];
export const GMP_LABELS = {
  WHO_GMP: 'WHO-GMP', US_FDA_CGMP: 'US FDA cGMP', EU_GMP: 'EU GMP',
  ISO_13485: 'ISO 13485', PIC_S: 'PIC/S', ISO_9001: 'ISO 9001', OTHER: 'Other'
};

export const LICENSE_TYPES = ['DRUG_MANUFACTURING', 'EXPORT_LICENSE', 'IMPORT_LICENSE', 'SCHEDULE_M', 'OTHER'];
export const LICENSE_LABELS = {
  DRUG_MANUFACTURING: 'Drug Manufacturing License',
  EXPORT_LICENSE: 'Export License',
  IMPORT_LICENSE: 'Import License',
  SCHEDULE_M: 'Schedule M Compliance',
  OTHER: 'Other License'
};
export const DOCUMENT_TYPES = ['PRODUCT_SPEC', 'PROCESS_DESCRIPTION', 'ANALYTICAL_METHOD', 'COA_TEMPLATE', 'DMF_REFERENCE', 'STABILITY_PROTOCOL', 'OTHER'];
export const DOCUMENT_TYPE_LABELS = {
  PRODUCT_SPEC: 'Product Specification', PROCESS_DESCRIPTION: 'Process Description',
  ANALYTICAL_METHOD: 'Analytical Methods', COA_TEMPLATE: 'COA Template',
  DMF_REFERENCE: 'DMF / CEP Reference', STABILITY_PROTOCOL: 'Stability Protocol', OTHER: 'Other'
};

export const THERAPEUTIC_AREAS = [
  'Oncology', 'CNS', 'Cardiovascular', 'Diabetes', 'Infectious Disease',
  'Respiratory', 'Dermatology', 'Ophthalmology', 'Rare Disease', 'Other'
];

export const BATCH_SCALES = ['LAB_PILOT_1KG', 'PILOT_1_50KG', 'SCALE_50_500KG', 'COMMERCIAL_500KG_PLUS', 'NOT_SPECIFIED'];
export const BATCH_SCALE_LABELS = {
  LAB_PILOT_1KG: 'Lab / Pilot (< 1 kg)', PILOT_1_50KG: 'Pilot (1–50 kg)',
  SCALE_50_500KG: 'Scale-up (50–500 kg)', COMMERCIAL_500KG_PLUS: 'Commercial (500 kg+)',
  NOT_SPECIFIED: 'To be discussed'
};

/** Incoterms 2020 — common for API / CDMO supply agreements */
export const PHARMA_INCOTERMS = [
  { value: '', label: 'Select preferred terms' },
  { value: 'EXW', label: 'EXW — Ex Works' },
  { value: 'FCA', label: 'FCA — Free Carrier' },
  { value: 'CPT', label: 'CPT — Carriage Paid To' },
  { value: 'CIP', label: 'CIP — Carriage & Insurance Paid To' },
  { value: 'DAP', label: 'DAP — Delivered at Place' },
  { value: 'DPU', label: 'DPU — Delivered at Place Unloaded' },
  { value: 'DDP', label: 'DDP — Delivered Duty Paid' },
  { value: 'FOB', label: 'FOB — Free on Board' },
  { value: 'CFR', label: 'CFR — Cost & Freight' },
  { value: 'CIF', label: 'CIF — Cost, Insurance & Freight' }
];

export const BUYER_COMPANY_TYPES = ['INNOVATOR', 'GENERIC', 'BIOTECH', 'CRO', 'DISTRIBUTOR', 'OTHER'];
export const BUYER_COMPANY_TYPE_LABELS = {
  INNOVATOR: 'Innovator / Big Pharma',
  GENERIC: 'Generic Manufacturer',
  BIOTECH: 'Biotech',
  CRO: 'CRO / CMO Buyer',
  DISTRIBUTOR: 'Distributor / Trader',
  OTHER: 'Other'
};

export const MAX_PHARMA_DOC_BYTES = 150 * 1024 * 1024;

export const labelFor = (map, key) => map[key] || key?.replace(/_/g, ' ') || '—';
