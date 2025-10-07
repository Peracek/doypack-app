export interface Order {
  id: number;
  order_code: string;
  material_type: string;
  print_coverage: number;
  package_size: number;
  sackovacka: string | null;
  note: string | null;
  created_at: string;
}

export interface Attempt {
  id: number;
  order_id: number;
  outcome: 'Úspěch' | 'Neúspěch';
  created_at: string;

  // Legacy single-phase parameters
  sealing_temperature_c: number | null;
  sealing_pressure_bar: number | null;
  dwell_time_s: number | null;

  // Zipper sealing phase
  zipper_temperature_c: number | null;
  zipper_pressure_bar: number | null;
  zipper_dwell_time_s: number | null;

  // Bottom sealing phase
  bottom_temperature_c: number | null;
  bottom_pressure_bar: number | null;
  bottom_dwell_time_s: number | null;

  // Side sealing phases (E, D, C, B, A)
  side_e_temperature_c: number | null; // Legacy - kept for backward compatibility
  side_e_temperature_upper_c: number | null;
  side_e_temperature_lower_c: number | null;
  side_e_pressure_bar: number | null;
  side_e_dwell_time_s: number | null;

  side_d_temperature_c: number | null; // Legacy - kept for backward compatibility
  side_d_temperature_upper_c: number | null;
  side_d_temperature_lower_c: number | null;
  side_d_pressure_bar: number | null;
  side_d_dwell_time_s: number | null;

  side_c_temperature_c: number | null; // Legacy - kept for backward compatibility
  side_c_temperature_upper_c: number | null;
  side_c_temperature_lower_c: number | null;
  side_c_pressure_bar: number | null;
  side_c_dwell_time_s: number | null;

  side_b_temperature_c: number | null; // Legacy - kept for backward compatibility
  side_b_temperature_upper_c: number | null;
  side_b_temperature_lower_c: number | null;
  side_b_pressure_bar: number | null;
  side_b_dwell_time_s: number | null;

  side_a_temperature_c: number | null; // Legacy - kept for backward compatibility
  side_a_temperature_upper_c: number | null;
  side_a_temperature_lower_c: number | null;
  side_a_pressure_bar: number | null;
  side_a_dwell_time_s: number | null;

  note: string | null;
}

export interface CreateOrderInput {
  order_code: string;
  material_type: string;
  print_coverage: number;
  package_size: number;
  sackovacka: string;
  note?: string;
}

export interface CreateAttemptInput {
  order_id: number;
  outcome: 'Úspěch' | 'Neúspěch';

  // Zipper phase
  zipper_temperature_c: number;
  zipper_pressure_bar: number;
  zipper_dwell_time_s: number;

  // Bottom phase
  bottom_temperature_c: number;
  bottom_pressure_bar: number;
  bottom_dwell_time_s: number;

  // Side phases
  side_e_temperature_upper_c: number;
  side_e_temperature_lower_c: number;
  side_e_pressure_bar: number;
  side_e_dwell_time_s: number;

  side_d_temperature_upper_c: number;
  side_d_temperature_lower_c: number;
  side_d_pressure_bar: number;
  side_d_dwell_time_s: number;

  side_c_temperature_upper_c: number;
  side_c_temperature_lower_c: number;
  side_c_pressure_bar: number;
  side_c_dwell_time_s: number;

  side_b_temperature_upper_c: number;
  side_b_temperature_lower_c: number;
  side_b_pressure_bar: number;
  side_b_dwell_time_s: number;

  side_a_temperature_upper_c: number;
  side_a_temperature_lower_c: number;
  side_a_pressure_bar: number;
  side_a_dwell_time_s: number;

  note?: string;
}

export const MATERIAL_OPTIONS = [
  'PAP/PET/LDPE (MAT-02448)',
  'PAP/PET/LDPE (MAT-02841)',
  'BOPP/BOPP MET/CPP (MAT-02514)',
  'BOPP/BOPP ALOX/CPP (MAT-02481)',
  'BOPP/PET MET/LDPE (MAT-02381)',
  'BOPP/PET TRA/LDPE (MAT-02675)',
  'PET/PET MET/LDPE (MAT-02381)',
  'PET/PET TRA/LDPE (MAT-02675)',
];

export const PACKAGE_SIZE_OPTIONS = [
  { label: '≥ 85 mm', value: 1 },
  { label: '≥ 90 mm', value: 2 },
  { label: '≥ 130 mm', value: 3 },
  { label: '≥ 160 mm', value: 4 },
  { label: '≥ 180 mm', value: 5 },
  { label: '≥ 230 mm', value: 6 },
];

export const SACKOVACKA_OPTIONS = ['S1', 'S2', 'S3', 'S4'];

export function getPackageSizeLabel(size: number | null): string {
  if (size === null) return 'N/A';
  const option = PACKAGE_SIZE_OPTIONS.find(o => o.value === size);
  return option?.label || String(size);
}
