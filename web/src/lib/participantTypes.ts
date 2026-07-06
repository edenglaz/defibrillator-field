export const PARTICIPANT_TYPE_OPTIONS = [
  { value: 'defibrillator_owner', label: 'בעל/ת דפיברילטור נייד' },
  { value: 'lora_hiker', label: 'נושא/ת LoRa — מטייל/ת / טבע' },
  { value: 'lora_biker', label: 'נושא/ת LoRa — רוכב/ת אופניים / אופנוע' },
  { value: 'lora_guide', label: 'נושא/ת LoRa — מדריך/ה / מטיילים מקצועי' },
  { value: 'lora_home', label: 'תחנת LoRa קבועה — בעל/ת בית באזור טבע' },
  { value: 'lora_other', label: 'נושא/ת LoRa — אחר (הגברת רשת)' },
] as const;

export function participantTypeLabel(value?: string): string {
  return PARTICIPANT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value ?? '—';
}
