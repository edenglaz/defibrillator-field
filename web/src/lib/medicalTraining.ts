/** תוויות עברית להכשרה רפואית — Fleet / Registration */
export const MEDICAL_TRAINING_OPTIONS = [
  { value: 'none', label: 'אין / לא רלוונטי' },
  { value: 'cpr', label: 'החייאה (CPR)' },
  { value: 'first_aid', label: 'עזרה ראשונה' },
  { value: 'medic', label: 'חובש / כונן' },
  { value: 'other', label: 'הכשרה רפואית אחרת' },
] as const;

export type MedicalTraining = (typeof MEDICAL_TRAINING_OPTIONS)[number]['value'];

export function medicalTrainingLabel(value: string): string {
  return MEDICAL_TRAINING_OPTIONS.find((o) => o.value === value)?.label || value;
}
