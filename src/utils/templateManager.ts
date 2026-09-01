import { RotaConfig, RotaTemplate, StaffRow, StaffShiftPattern } from '../types';
import { TIME_SLOTS } from '../constants/activities';
import { BUILT_IN_ROTA_TEMPLATES, BUILT_IN_STAFF_SHIFT_PATTERNS } from '../constants/defaultTemplates';

const CUSTOM_TEMPLATES_STORAGE_KEY = 'tca_saved_templates_v1';

// Calculate total working hours from a slots map
export const calculateSlotsHours = (slots: Record<string, string>): number => {
  let minutes = 0;
  TIME_SLOTS.forEach(slot => {
    const val = slots[slot];
    if (val && val !== 'OFF' && val !== 'TCA Break') {
      const is15Min = slot.includes(':15') || slot.includes(':45') || slot.includes('11:30 - 11:45') || slot.includes('11:45 - 12:00') || slot.includes('12:30 - 12:45') || slot.includes('12:45 - 01:00') || slot.includes('03:00 - 03:15') || slot.includes('03:15 - 03:30');
      minutes += is15Min ? 15 : 30;
    }
  });
  return minutes / 60;
};

// Calculate break minutes from a slots map
export const calculateBreakMinutes = (slots: Record<string, string>): number => {
  let minutes = 0;
  TIME_SLOTS.forEach(slot => {
    const val = slots[slot];
    if (val === 'TCA Break') {
      const is15Min = slot.includes(':15') || slot.includes(':45') || slot.includes('11:30 - 11:45') || slot.includes('11:45 - 12:00') || slot.includes('12:30 - 12:45') || slot.includes('12:45 - 01:00') || slot.includes('03:00 - 03:15') || slot.includes('03:15 - 03:30');
      minutes += is15Min ? 15 : 30;
    }
  });
  return minutes;
};

// Get custom templates from localStorage
export const getCustomTemplates = (): RotaTemplate[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading custom templates from storage:', err);
  }
  return [];
};

// Save custom templates to localStorage
const persistCustomTemplates = (templates: RotaTemplate[]): void => {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Error saving custom templates to storage:', err);
  }
};

// Get all templates (built-in + custom)
export const getAllRotaTemplates = (): RotaTemplate[] => {
  const custom = getCustomTemplates();
  return [...BUILT_IN_ROTA_TEMPLATES, ...custom];
};

// Get single staff shift patterns
export const getAllStaffShiftPatterns = (): StaffShiftPattern[] => {
  return BUILT_IN_STAFF_SHIFT_PATTERNS;
};

// Save current Rota as a custom template
export const saveRotaAsTemplate = (
  rota: RotaConfig,
  name: string,
  description: string,
  category: 'standard' | 'early_shift' | 'late_shift' | 'weekend_peak' | 'skeleton' | 'custom' = 'custom',
  tag: string = 'Custom'
): RotaTemplate => {
  const customList = getCustomTemplates();

  const rows = rota.rows.map(r => ({
    name: r.name,
    role: r.role || 'TCA Staff',
    slots: { ...r.slots }
  }));

  let totalMinutes = 0;
  rows.forEach(r => {
    totalMinutes += calculateSlotsHours(r.slots) * 60;
  });
  const totalHours = totalMinutes / 60;
  const averageHoursPerStaff = rows.length > 0 ? totalHours / rows.length : 0;

  const newTemplate: RotaTemplate = {
    id: `template-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || `Saved Rota (${new Date().toLocaleDateString()})`,
    description: description.trim() || `Custom shift pattern saved on ${new Date().toLocaleDateString()}`,
    category,
    tag: tag.trim() || 'Custom',
    createdAt: new Date().toISOString(),
    isBuiltIn: false,
    staffCount: rows.length,
    targetMinCoverage: rota.targetMinCoverage || 6,
    totalHours: Number(totalHours.toFixed(1)),
    averageHoursPerStaff: Number(averageHoursPerStaff.toFixed(1)),
    timeSlots: rota.timeSlots || TIME_SLOTS,
    rows
  };

  const updated = [newTemplate, ...customList];
  persistCustomTemplates(updated);
  return newTemplate;
};

// Delete a custom template
export const deleteCustomTemplate = (templateId: string): boolean => {
  const customList = getCustomTemplates();
  const filtered = customList.filter(t => t.id !== templateId);
  if (filtered.length !== customList.length) {
    persistCustomTemplates(filtered);
    return true;
  }
  return false;
};

// Update an existing custom template's name/description
export const updateCustomTemplate = (
  templateId: string,
  updates: { name?: string; description?: string; category?: RotaTemplate['category']; tag?: string }
): RotaTemplate | null => {
  const customList = getCustomTemplates();
  let updatedTemplate: RotaTemplate | null = null;

  const updated = customList.map(t => {
    if (t.id === templateId) {
      updatedTemplate = {
        ...t,
        ...updates
      };
      return updatedTemplate;
    }
    return t;
  });

  if (updatedTemplate) {
    persistCustomTemplates(updated);
  }
  return updatedTemplate;
};

// Export templates as a JSON string for backup/sharing
export const exportTemplatesAsJson = (): string => {
  const allTemplates = getAllRotaTemplates();
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      templates: allTemplates
    },
    null,
    2
  );
};

// Import templates from a JSON string
export const importTemplatesFromJson = (jsonStr: string): { importedCount: number; error?: string } => {
  try {
    const data = JSON.parse(jsonStr);
    const templatesToImport: RotaTemplate[] = [];

    const rawList = Array.isArray(data) ? data : data?.templates;
    if (!Array.isArray(rawList)) {
      return { importedCount: 0, error: 'Invalid JSON format: Expected a templates array.' };
    }

    rawList.forEach((item: any, idx: number) => {
      if (item && item.name && Array.isArray(item.rows)) {
        templatesToImport.push({
          id: `template-imported-${Date.now()}-${idx}`,
          name: String(item.name).trim(),
          description: String(item.description || 'Imported template').trim(),
          category: item.category || 'custom',
          tag: item.tag || 'Imported',
          createdAt: new Date().toISOString(),
          isBuiltIn: false,
          staffCount: item.rows.length,
          targetMinCoverage: item.targetMinCoverage || 6,
          totalHours: item.totalHours || 0,
          averageHoursPerStaff: item.averageHoursPerStaff || 0,
          timeSlots: item.timeSlots || TIME_SLOTS,
          rows: item.rows.map((r: any, rIdx: number) => ({
            name: r.name || `Assistant ${String(rIdx + 1).padStart(2, '0')}`,
            role: r.role || 'TCA Staff',
            slots: typeof r.slots === 'object' && r.slots !== null ? r.slots : {}
          }))
        });
      }
    });

    if (templatesToImport.length === 0) {
      return { importedCount: 0, error: 'No valid template items found in the imported file.' };
    }

    const currentCustom = getCustomTemplates();
    const merged = [...templatesToImport, ...currentCustom];
    persistCustomTemplates(merged);

    return { importedCount: templatesToImport.length };
  } catch (err: any) {
    return { importedCount: 0, error: err?.message || 'Failed to parse JSON file.' };
  }
};

export type ApplyTemplateMode = 'full_replace' | 'pattern_only' | 'merge_fill_empty';

// Apply a full rota template to the current RotaConfig
export const applyTemplateToRota = (
  currentRota: RotaConfig,
  template: RotaTemplate,
  mode: ApplyTemplateMode = 'pattern_only'
): RotaConfig => {
  if (mode === 'full_replace') {
    // Completely replaces rows with the template's staff names and assignments
    const newRows: StaffRow[] = template.rows.map((tRow, idx) => ({
      id: `assistant-${idx + 1}-${Date.now().toString(36)}`,
      name: tRow.name,
      role: tRow.role || 'TCA Staff',
      skills: ['Classroom', 'Hallways', 'Reception'],
      slots: { ...tRow.slots },
      notes: '',
      targetHours: 7.5
    }));

    return {
      ...currentRota,
      targetMinCoverage: template.targetMinCoverage || currentRota.targetMinCoverage,
      rows: newRows
    };
  }

  if (mode === 'pattern_only') {
    // Keeps current assistant names & IDs, applies template slot patterns in order
    const updatedRows: StaffRow[] = currentRota.rows.map((staff, idx) => {
      const templateRow = template.rows[idx % template.rows.length];
      return {
        ...staff,
        slots: { ...templateRow.slots }
      };
    });

    // If template has more rows than current rota and user wants full pattern coverage, we can pad
    if (template.rows.length > currentRota.rows.length) {
      const addedRows: StaffRow[] = [];
      for (let i = currentRota.rows.length; i < template.rows.length; i++) {
        const tRow = template.rows[i];
        addedRows.push({
          id: `assistant-${i + 1}-${Date.now().toString(36)}`,
          name: tRow.name,
          role: tRow.role || 'TCA Staff',
          skills: ['Classroom', 'Hallways', 'Reception'],
          slots: { ...tRow.slots },
          notes: '',
          targetHours: 7.5
        });
      }
      return {
        ...currentRota,
        targetMinCoverage: template.targetMinCoverage || currentRota.targetMinCoverage,
        rows: [...updatedRows, ...addedRows]
      };
    }

    return {
      ...currentRota,
      targetMinCoverage: template.targetMinCoverage || currentRota.targetMinCoverage,
      rows: updatedRows
    };
  }

  // mode === 'merge_fill_empty': Only populate slots that are currently blank
  const mergedRows: StaffRow[] = currentRota.rows.map((staff, idx) => {
    const templateRow = template.rows[idx % template.rows.length];
    const newSlots = { ...staff.slots };

    TIME_SLOTS.forEach(slot => {
      if (!newSlots[slot] || newSlots[slot].trim() === '') {
        if (templateRow.slots[slot]) {
          newSlots[slot] = templateRow.slots[slot];
        }
      }
    });

    return {
      ...staff,
      slots: newSlots
    };
  });

  return {
    ...currentRota,
    rows: mergedRows
  };
};

// Apply an individual StaffShiftPattern to a single staff row
export const applyStaffPatternToRow = (
  row: StaffRow,
  pattern: StaffShiftPattern,
  mergeOnly: boolean = false
): StaffRow => {
  if (!mergeOnly) {
    return {
      ...row,
      slots: { ...pattern.slots }
    };
  }

  const merged = { ...row.slots };
  TIME_SLOTS.forEach(slot => {
    if (!merged[slot] || merged[slot].trim() === '') {
      if (pattern.slots[slot]) {
        merged[slot] = pattern.slots[slot];
      }
    }
  });

  return {
    ...row,
    slots: merged
  };
};
