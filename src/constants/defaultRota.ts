import { StaffRow, RotaConfig } from '../types';
import { TIME_SLOTS } from './activities';

export const INITIAL_ASSISTANT_ROWS_DATA = [
  {
    name: 'Assistant 01',
    role: 'TCA Staff',
    assignments: [
      'Corridor', '', 'Corridor', 'Floating (2,3,4)', 'Corridor 2', 'TCA Break', 'Exit Door', '',
      'Help desk/ Card creation', '', 'Line up R2',
      'Primary Starter B (LP) Room 2 (Randa Mukhtar)', '', '', 'End of class 2', 'Corridor', 'Floating (5,6)',
      'Corridor', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', '', ''
    ]
  },
  {
    name: 'Assistant 02',
    role: 'TCA Staff',
    assignments: [
      'Ushering', 'Line up R6', 'Floating (2,3,4)', 'Corridor', 'Floating (5,6)', 'Corridor', 'Exit Door', '',
      'TCA Break', 'Floating (5,6)', 'Line up R1',
      'Primary Starter A (LP) Room 1(Kevin Sterling)', '', '', 'Exit Door', '', 'Help desk/ Card creation',
      'Corridor 2', 'Floating (2,3,4)', '', 'Waiting area', '', ''
    ]
  },
  {
    name: 'Assistant 03',
    role: 'TCA Staff',
    assignments: [
      'Exit Door', 'Line up R5', 'Exit Door', 'Floating (2,3,4)', 'Corridor', 'Floating (5,6)', 'End of class 4', 'Waiting area',
      'TCA Break', 'Corridor 2', 'Line up R3',
      'Corridor', 'TCA Break', 'Corridor', 'Floating (2,3,4)', 'End of class 1', 'Line up R3',
      'Exit Door', 'Floating (2,3,4)', 'Corridor 2', 'Exit Door', 'End of class 4', ''
    ]
  },
  {
    name: 'Assistant 04',
    role: 'TCA Staff',
    assignments: [
      'Signs', 'Line up R1', 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3', '', '', '', 'End of class 1', 'Floating (2,3,4)',
      '', 'Corridor', '',
      'TCA Break', 'Exit Door', 'Floating (2,3,4)', 'Corridor', 'End of class 4', 'Line up R6',
      'Floating (2,3,4)', 'Exit Door', 'Corridor', 'Corridor 2', 'Exit Door', ''
    ]
  },
  {
    name: 'Assistant 05',
    role: 'TCA Staff',
    assignments: [
      'Inside Usher', 'Line up R2', 'Primary Starter B (LP) Room 2 (Nihad Badr)', '', '', '', 'End of class 2', 'Waiting area',
      '', 'Floating (2,3,4)', 'Help desk/ Card creation',
      '', '', 'TCA Break', 'Corridor 2', 'Exit Door', '',
      'Corridor', 'Floating (5,6)', 'Floating (2,3,4)', 'Floating (5,6)', 'Exit Door', ''
    ]
  },
  {
    name: 'Assistant 06',
    role: 'TCA Staff',
    assignments: [
      'Help desk/CS support', '', '', '', 'Floating (2,3,4)', 'Corridor 2', 'End of class 6', 'Floating (5,6)',
      'TCA Break', 'Exit Door', '',
      'Corridor', 'Floating (5,6)', 'Corridor', 'Floating (2,3,4)', 'End of class 5', 'Line up R2',
      'Primary Starter B (LP) Room 2 (Kevin Sterling)', '', '', '', 'End of class 2', ''
    ]
  },
  {
    name: 'Assistant 07',
    role: 'TCA Staff',
    assignments: [
      'Floating (5,6)', '', 'Floating (5,6)', 'Corridor 2', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'Corridor 2',
      'TCA Break', 'Signs Exchange', 'Line up R5',
      'Floating (2,3,4)', 'Corridor 2', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'Line up R4',
      'Corridor 2', 'Corridor', 'Floating (5,6)', 'Corridor', 'End of class 3', ''
    ]
  },
  {
    name: 'Assistant 08',
    role: 'TCA Staff',
    assignments: [
      'Ushering', 'Line up R4', 'Floating (2,3,4)', 'Floating (5,6)', 'Exit Door', 'Floating (2,3,4)', 'End of class 5', 'Corridor',
      'TCA Break', 'Corridor', '',
      'Floating (5,6)', 'Floating (2,3,4)', 'Floating (5,6)', 'Signs Exchange', 'End of class 3', 'Line up R1',
      'Primary Starter A (LP) Room 1 (Nihad Badr)', '', '', '', 'End of class 1', ''
    ]
  },
  {
    name: 'Assistant 09',
    role: 'TCA Staff',
    assignments: [
      'Ushering', '', 'Floating (2,3,4)', 'Floating (5,6)', 'Corridor', 'Floating (2,3,4)', 'Exit Door', '',
      'TCA Break', 'Floating (2,3,4)', 'Line up R6',
      'Floating (2,3,4)', 'Corridor', 'Corridor 2', 'Exit Door', '', 'Corridor',
      'Corridor', 'Exit Door', 'Floating (2,3,4)', 'Floating (5,6)', 'End of class 5', ''
    ]
  },
  {
    name: 'Assistant 10',
    role: 'TCA Staff',
    assignments: [
      'Inside Usher', 'Line up R3', 'Exit Door', 'Corridor', 'Floating (5,6)', 'Corridor', 'Checking Home alone cards', 'Corridor',
      'Exit Door', '', '',
      'TCA Break', 'Corridor', 'Exit Door', 'Floating (5,6)', 'Checking Home alone cards', 'Waiting area',
      '', 'Floating (2,3,4)', 'Floating (5,6)', 'Corridor', 'Checking Home alone cards', ''
    ]
  },
  {
    name: 'Assistant 11',
    role: 'TCA Staff',
    assignments: [
      'Help desk/Card Creation', '', '', '', '', '', '', '',
      'Corridor 2', 'Ushering', '',
      'Exit Door', 'TCA Break', 'Help desk/Card Creation', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 12',
    role: 'TCA Staff',
    assignments: [
      'Corridor', '', 'Corridor 2', 'Exit Door', 'Floating (2,3,4)', 'Exit Door', 'End of class 3', 'Corridor',
      '', 'Floating (5,6)', 'Line up R4',
      'Corridor 2', 'TCA Break', 'Floating (2,3,4)', 'Corridor', 'End of class 6', 'Line up R5',
      'Floating (2,3,4)', 'Floating (5,6)', 'Exit Door', 'Floating (2,3,4)', 'End of class 6', ''
    ]
  }
];

const DEFAULT_SAMPLE_SKILLS: string[][] = [
  ['Senior', 'Classroom'],
  ['First Aid', 'Bilingual'],
  ['Team Lead', 'Senior'],
  ['Bilingual', 'Reception'],
  ['Fire Warden', 'Hallways'],
  ['First Aid', 'Classroom'],
  ['Senior', 'Hallways'],
  ['Bilingual', 'Reception'],
  ['First Aid', 'Team Lead'],
  ['Senior', 'Bilingual'],
  ['Classroom', 'Reception'],
  ['Fire Warden', 'Hallways']
];

export const createDefaultStaffRow = (index: number, name?: string): StaffRow => {
  const staffName = name || `Assistant ${String(index + 1).padStart(2, '0')}`;
  const slots: Record<string, string> = {};

  TIME_SLOTS.forEach(slot => {
    slots[slot] = '';
  });

  const sampleSkillSet = DEFAULT_SAMPLE_SKILLS[index % DEFAULT_SAMPLE_SKILLS.length] || ['Classroom', 'Reception'];

  return {
    id: `assistant-${index + 1}-${Date.now().toString(36)}`,
    name: staffName,
    role: index === 0 ? 'Lead TCA Staff' : 'TCA Staff',
    skills: sampleSkillSet,
    slots,
    notes: '',
    targetHours: 7.5
  };
};

export const createDefaultRota = (): RotaConfig => {
  const rows: StaffRow[] = INITIAL_ASSISTANT_ROWS_DATA.map((data, idx) => {
    const slots: Record<string, string> = {};
    TIME_SLOTS.forEach((slot, slotIdx) => {
      slots[slot] = data.assignments[slotIdx] || '';
    });

    const sampleSkillSet = DEFAULT_SAMPLE_SKILLS[idx % DEFAULT_SAMPLE_SKILLS.length] || ['Classroom', 'Reception'];

    return {
      id: `assistant-${idx + 1}`,
      name: data.name,
      role: idx === 0 ? 'Lead TCA Staff' : 'TCA Staff',
      skills: sampleSkillSet,
      slots,
      notes: '',
      targetHours: 7.5
    };
  });

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[today.getDay()];

  return {
    id: `rota-${Date.now()}`,
    title: 'Assistant Shift Rota',
    date: dateStr,
    dayOfWeek,
    department: 'TCA Operations',
    targetMinCoverage: 6,
    timeSlots: TIME_SLOTS,
    rows
  };
};
