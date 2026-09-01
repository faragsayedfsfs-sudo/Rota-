import { RotaTemplate, StaffShiftPattern } from '../types';
import { TIME_SLOTS } from './activities';

// Calculate total hours for a slot record
const calculateSlotsHours = (slots: Record<string, string>): number => {
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

// 1. STANDARD BALANCED ROSTER (12 Assistants)
const STANDARD_BALANCED_ROWS = [
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
      'Help desk/ Card creation', '', '', '', '', '', '', '',
      'Corridor 2', 'Ushering', '',
      'Exit Door', 'TCA Break', 'Help desk/ Card creation', '', '', '',
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

// 2. EARLY SHIFT ROSTER (Morning Peak & Starters heavy)
const EARLY_SHIFT_ROWS = [
  {
    name: 'Assistant 01 (Morning Lead)',
    role: 'TCA Staff',
    assignments: [
      'Signs', 'Line up R1', 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3', '', '', '', 'End of class 1', 'Floating (2,3,4)',
      'TCA Break', 'Corridor', 'Line up R2',
      'Floating (2,3,4)', 'Corridor 2', '', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 02 (Morning Usher)',
    role: 'TCA Staff',
    assignments: [
      'Ushering', 'Line up R2', 'Floating (2,3,4)', 'Corridor', 'Floating (5,6)', 'Corridor', 'Exit Door', 'Waiting area',
      'TCA Break', 'Floating (5,6)', 'Line up R1',
      'Exit Door', '', '', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 03 (Arrival Security)',
    role: 'TCA Staff',
    assignments: [
      'Exit Door', 'Line up R3', 'Exit Door', 'Floating (2,3,4)', 'Corridor 2', 'Floating (5,6)', 'End of class 4', 'Corridor',
      'Corridor 2', 'TCA Break', 'Line up R3',
      'Corridor', 'Floating (2,3,4)', '', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 04 (Class Starter A)',
    role: 'TCA Staff',
    assignments: [
      'Inside Usher', 'Line up R4', 'Primary Starter A (LP) Room 1(Kevin Sterling)', '', '', '', 'End of class 2', 'Floating (2,3,4)',
      '', 'TCA Break', 'Help desk/ Card creation',
      'Corridor', '', '', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 05 (Class Starter B)',
    role: 'TCA Staff',
    assignments: [
      'Help desk/ Card creation', 'Line up R5', 'Primary Starter B (LP) Room 2 (Nihad Badr)', '', '', '', 'End of class 3', 'Waiting area',
      'TCA Break', 'Help desk/CS support', 'Line up R4',
      'Exit Door', '', '', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 06 (Morning Desk/CS)',
    role: 'TCA Staff',
    assignments: [
      'Help desk/CS support', 'Line up R6', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'Corridor 2', 'End of class 6', 'Floating (5,6)',
      'TCA Break', 'Signs Exchange', 'Line up R5',
      'Corridor 2', '', '', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 07 (Early Floater)',
    role: 'TCA Staff',
    assignments: [
      'Floating (5,6)', 'Ushering', 'Floating (2,3,4)', 'Corridor 2', 'Floating (5,6)', 'Corridor', 'End of class 5', 'Corridor 2',
      'Floating (2,3,4)', 'TCA Break', 'Line up R6',
      'Floating (5,6)', 'End of class 1', '', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 08 (Mid-Morning Support)',
    role: 'TCA Staff',
    assignments: [
      'Corridor', 'Inside Usher', 'Corridor', 'Exit Door', 'Floating (2,3,4)', 'Exit Door', 'Checking Home alone cards', 'Corridor',
      '', 'Floating (2,3,4)', 'TCA Break',
      'Corridor 2', 'Floating (2,3,4)', 'Line up R1', 'Exit Door', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 09 (Full Day Bridge)',
    role: 'TCA Staff',
    assignments: [
      'Ushering', '', 'Floating (2,3,4)', 'Floating (5,6)', 'Corridor', 'Floating (2,3,4)', 'Exit Door', '',
      'TCA Break', 'Floating (2,3,4)', 'Line up R6',
      'Floating (2,3,4)', 'Corridor', 'Corridor 2', 'Exit Door', '', 'Corridor',
      'Corridor', 'Exit Door', 'Floating (2,3,4)', 'Floating (5,6)', 'End of class 5', ''
    ]
  },
  {
    name: 'Assistant 10 (Full Day Bridge)',
    role: 'TCA Staff',
    assignments: [
      'Inside Usher', 'Line up R3', 'Exit Door', 'Corridor', 'Floating (5,6)', 'Corridor', 'Checking Home alone cards', 'Corridor',
      'Exit Door', '', '',
      'TCA Break', 'Corridor', 'Exit Door', 'Floating (5,6)', 'Checking Home alone cards', 'Waiting area',
      '', 'Floating (2,3,4)', 'Floating (5,6)', 'Corridor', 'Checking Home alone cards', ''
    ]
  }
];

// 3. LATE SHIFT ROSTER (Afternoon, Prayer Handover & Evening Classes Heavy)
const LATE_SHIFT_ROWS = [
  {
    name: 'Assistant 01 (Late Shift Lead)',
    role: 'TCA Staff',
    assignments: [
      '', '', '', '', '', '', '', '',
      'Corridor', 'Floating (2,3,4)', 'Line up R1',
      'Primary Starter B (LP) Room 2 (Randa Mukhtar)', '', '', 'End of class 2', 'Corridor', 'Floating (5,6)',
      'TCA Break', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'Exit Door', 'End of class 6'
    ]
  },
  {
    name: 'Assistant 02 (Classroom Afternoon)',
    role: 'TCA Staff',
    assignments: [
      '', '', '', '', '', '', '', '',
      'Help desk/ Card creation', 'Line up R2', 'Exit Door',
      'Primary Starter A (LP) Room 1(Kevin Sterling)', '', '', 'Exit Door', '', 'Help desk/ Card creation',
      'Corridor 2', 'TCA Break', 'Floating (2,3,4)', 'Waiting area', 'Exit Door', 'End of class 1'
    ]
  },
  {
    name: 'Assistant 03 (Afternoon CS & Calls)',
    role: 'TCA Staff',
    assignments: [
      '', '', '', '', '', '', '', '',
      'Floating (5,6)', 'Corridor 2', 'Line up R3',
      'Floating (2,3,4)', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'End of class 1', 'Line up R3',
      'Exit Door', 'TCA Break', 'Corridor 2', 'Exit Door', 'End of class 4', 'Signs Exchange'
    ]
  },
  {
    name: 'Assistant 04 (Late Classroom Support)',
    role: 'TCA Staff',
    assignments: [
      '', '', '', '', '', '', '', '',
      'Signs', 'Line up R4', 'Corridor',
      'Primary Starter B (LP) Room 2 (Kevin Sterling)', '', '', '', 'End of class 4', 'Line up R6',
      'Floating (2,3,4)', 'Exit Door', 'TCA Break', 'Corridor 2', 'Exit Door', 'End of class 2'
    ]
  },
  {
    name: 'Assistant 05 (Late Floater 1)',
    role: 'TCA Staff',
    assignments: [
      '', '', '', '', '', '', '', '',
      'Corridor 2', 'Floating (2,3,4)', 'Help desk/ Card creation',
      'Floating (5,6)', 'Floating (2,3,4)', 'Floating (5,6)', 'Corridor 2', 'Exit Door', 'Line up R2',
      'Corridor', 'Floating (5,6)', 'Floating (2,3,4)', 'TCA Break', 'Exit Door', 'Waiting area'
    ]
  },
  {
    name: 'Assistant 06 (Late Floater 2)',
    role: 'TCA Staff',
    assignments: [
      '', '', '', '', '', '', '', '',
      'Exit Door', 'Signs Exchange', 'Line up R5',
      'Corridor', 'Floating (5,6)', 'Corridor', 'Floating (2,3,4)', 'End of class 5', 'Line up R4',
      'TCA Break', 'Corridor', 'Floating (5,6)', 'Corridor', 'End of class 3', 'Exit Door'
    ]
  },
  {
    name: 'Assistant 07 (Afternoon Desk)',
    role: 'TCA Staff',
    assignments: [
      '', '', '', '', '', '', '', '',
      'Help desk/CS support', 'Corridor', 'Line up R6',
      'Help desk/ Card creation', 'Corridor 2', 'Help desk/CS support', 'Signs Exchange', 'End of class 3', 'Line up R1',
      'Primary Starter A (LP) Room 1 (Nihad Badr)', '', '', 'TCA Break', 'End of class 1', 'Signs'
    ]
  },
  {
    name: 'Assistant 08 (Departure Ushering)',
    role: 'TCA Staff',
    assignments: [
      '', '', '', '', '', '', '', '',
      'Ushering', 'Inside Usher', 'Corridor 2',
      'Floating (2,3,4)', 'Corridor', 'Corridor 2', 'Exit Door', 'Waiting area', 'Corridor',
      'Corridor', 'Exit Door', 'TCA Break', 'Floating (5,6)', 'End of class 5', 'Ushering'
    ]
  },
  {
    name: 'Assistant 09 (Morning Bridge 1)',
    role: 'TCA Staff',
    assignments: [
      'Ushering', 'Line up R6', 'Floating (2,3,4)', 'Corridor', 'Floating (5,6)', 'Corridor', 'Exit Door', 'Waiting area',
      'TCA Break', 'Floating (5,6)', 'Line up R1',
      'Exit Door', 'Corridor 2', 'Exit Door', '', '', '',
      '', '', '', '', '', ''
    ]
  },
  {
    name: 'Assistant 10 (Morning Bridge 2)',
    role: 'TCA Staff',
    assignments: [
      'Corridor', 'Line up R1', 'Corridor', 'Floating (2,3,4)', 'Corridor 2', 'TCA Break', 'Exit Door', '',
      'Help desk/ Card creation', '', 'Line up R2',
      'Corridor', 'Floating (2,3,4)', '', '', '', '',
      '', '', '', '', '', ''
    ]
  }
];

// 4. WEEKEND PEAK ROSTER (Maximum Footfall, Doors, All Floaters Active)
const WEEKEND_PEAK_ROWS = [
  {
    name: 'Assistant 01 (Door Chief)',
    role: 'TCA Staff',
    assignments: [
      'Ushering', 'Line up R1', 'Exit Door', 'Floating (2,3,4)', 'Ushering', 'TCA Break', 'Exit Door', 'Waiting area',
      'Help desk/ Card creation', 'Exit Door', 'Line up R2',
      'Exit Door', 'Corridor', 'Exit Door', 'End of class 2', 'Ushering', 'Floating (5,6)',
      'Corridor', 'Exit Door', 'Ushering', 'Exit Door', 'End of class 6', 'Waiting area'
    ]
  },
  {
    name: 'Assistant 02 (Inside Usher Lead)',
    role: 'TCA Staff',
    assignments: [
      'Inside Usher', 'Line up R2', 'Inside Usher', 'Corridor', 'Inside Usher', 'Corridor', 'Exit Door', 'Waiting area',
      'TCA Break', 'Inside Usher', 'Line up R1',
      'Primary Starter A (LP) Room 1(Kevin Sterling)', '', '', 'Exit Door', 'Inside Usher', 'Help desk/ Card creation',
      'Corridor 2', 'Inside Usher', 'Waiting area', 'Exit Door', 'End of class 1', 'Ushering'
    ]
  },
  {
    name: 'Assistant 03 (Corridor Patrol 1)',
    role: 'TCA Staff',
    assignments: [
      'Corridor', 'Line up R3', 'Corridor', 'Floating (2,3,4)', 'Corridor', 'Floating (5,6)', 'End of class 4', 'Corridor',
      'TCA Break', 'Corridor 2', 'Line up R3',
      'Corridor', 'TCA Break', 'Corridor', 'Floating (2,3,4)', 'End of class 1', 'Line up R3',
      'Corridor', 'Floating (2,3,4)', 'Corridor 2', 'Corridor', 'End of class 4', 'Corridor 2'
    ]
  },
  {
    name: 'Assistant 04 (Class Starter Lead)',
    role: 'TCA Staff',
    assignments: [
      'Signs', 'Line up R4', 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3', '', '', '', 'End of class 1', 'Floating (2,3,4)',
      'Corridor', 'TCA Break', 'Line up R4',
      'TCA Break', 'Exit Door', 'Floating (2,3,4)', 'Corridor', 'End of class 4', 'Line up R6',
      'Floating (2,3,4)', 'Exit Door', 'Corridor', 'Corridor 2', 'Exit Door', 'Signs'
    ]
  },
  {
    name: 'Assistant 05 (Class Starter Lead B)',
    role: 'TCA Staff',
    assignments: [
      'Inside Usher', 'Line up R5', 'Primary Starter B (LP) Room 2 (Nihad Badr)', '', '', '', 'End of class 2', 'Waiting area',
      'Floating (2,3,4)', 'Help desk/ Card creation', 'TCA Break',
      'Corridor 2', 'Exit Door', 'TCA Break', 'Corridor 2', 'Exit Door', 'Line up R2',
      'Corridor', 'Floating (5,6)', 'Floating (2,3,4)', 'Floating (5,6)', 'Exit Door', 'Waiting area'
    ]
  },
  {
    name: 'Assistant 06 (CS & Registration Desk)',
    role: 'TCA Staff',
    assignments: [
      'Help desk/CS support', 'Line up R6', 'Help desk/ Card creation', 'Help desk/CS support', 'Help desk/ Card creation', 'Corridor 2', 'End of class 6', 'Floating (5,6)',
      'TCA Break', 'Help desk/CS support', 'Help desk/ Card creation',
      'Corridor', 'Floating (5,6)', 'Corridor', 'Floating (2,3,4)', 'End of class 5', 'Line up R2',
      'Primary Starter B (LP) Room 2 (Kevin Sterling)', '', '', '', 'End of class 2', 'Help desk/CS support'
    ]
  },
  {
    name: 'Assistant 07 (Attendance & Home Cards)',
    role: 'TCA Staff',
    assignments: [
      'Floating (5,6)', 'Signs', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'Card Checking and Calls', 'Checking Home alone cards', 'Corridor 2',
      'TCA Break', 'Signs Exchange', 'Line up R5',
      'Floating (2,3,4)', 'Corridor 2', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'Line up R4',
      'Corridor 2', 'Corridor', 'Floating (5,6)', 'Corridor', 'End of class 3', 'Checking Home alone cards'
    ]
  },
  {
    name: 'Assistant 08 (Floater Specialist 1)',
    role: 'TCA Staff',
    assignments: [
      'Ushering', 'Line up R4', 'Floating (2,3,4)', 'Floating (5,6)', 'Exit Door', 'Floating (2,3,4)', 'End of class 5', 'Corridor',
      'TCA Break', 'Corridor', 'Floating (2,3,4)',
      'Floating (5,6)', 'Floating (2,3,4)', 'Floating (5,6)', 'Signs Exchange', 'End of class 3', 'Line up R1',
      'Primary Starter A (LP) Room 1 (Nihad Badr)', '', '', '', 'End of class 1', 'Floating (2,3,4)'
    ]
  },
  {
    name: 'Assistant 09 (Floater Specialist 2)',
    role: 'TCA Staff',
    assignments: [
      'Ushering', 'Inside Usher', 'Floating (2,3,4)', 'Floating (5,6)', 'Corridor', 'Floating (2,3,4)', 'Exit Door', 'Waiting area',
      'TCA Break', 'Floating (2,3,4)', 'Line up R6',
      'Floating (2,3,4)', 'Corridor', 'Corridor 2', 'Exit Door', 'Floating (5,6)', 'Corridor',
      'Corridor', 'Exit Door', 'Floating (2,3,4)', 'Floating (5,6)', 'End of class 5', 'Floating (5,6)'
    ]
  },
  {
    name: 'Assistant 10 (Signs & Security)',
    role: 'TCA Staff',
    assignments: [
      'Signs', 'Line up R3', 'Exit Door', 'Corridor', 'Floating (5,6)', 'Corridor', 'Checking Home alone cards', 'Corridor',
      'Exit Door', 'Signs Exchange', 'Line up R3',
      'TCA Break', 'Corridor', 'Exit Door', 'Floating (5,6)', 'Checking Home alone cards', 'Waiting area',
      'Signs Exchange', 'Floating (2,3,4)', 'Floating (5,6)', 'Corridor', 'Checking Home alone cards', 'Signs'
    ]
  },
  {
    name: 'Assistant 11 (Card Desk & Usher)',
    role: 'TCA Staff',
    assignments: [
      'Help desk/ Card creation', 'Ushering', 'Help desk/ Card creation', 'Waiting area', 'Help desk/ Card creation', 'Corridor', 'Waiting area', 'Exit Door',
      'Corridor 2', 'Ushering', 'Help desk/ Card creation',
      'Exit Door', 'TCA Break', 'Help desk/ Card creation', 'Waiting area', 'Exit Door', 'Line up R5',
      'Ushering', 'Waiting area', 'Help desk/ Card creation', 'Exit Door', 'Waiting area', 'Ushering'
    ]
  },
  {
    name: 'Assistant 12 (Hallway & Departure Chief)',
    role: 'TCA Staff',
    assignments: [
      'Corridor 2', 'Corridor', 'Corridor 2', 'Exit Door', 'Floating (2,3,4)', 'Exit Door', 'End of class 3', 'Corridor',
      'Floating (5,6)', 'Floating (5,6)', 'Line up R4',
      'Corridor 2', 'TCA Break', 'Floating (2,3,4)', 'Corridor', 'End of class 6', 'Line up R5',
      'Floating (2,3,4)', 'Floating (5,6)', 'Exit Door', 'Floating (2,3,4)', 'End of class 6', 'Exit Door'
    ]
  }
];

// 5. SKELETON / ESSENTIAL CREW (6 Assistants)
const SKELETON_ROWS = [
  {
    name: 'Assistant 01 (Door & Usher)',
    role: 'TCA Staff',
    assignments: [
      'Exit Door', 'Line up R1', 'Exit Door', 'Ushering', 'Exit Door', 'Ushering', 'End of class 1', 'Exit Door',
      'TCA Break', 'Exit Door', 'Line up R1',
      'Exit Door', 'Corridor', 'Exit Door', 'End of class 2', 'Line up R2', 'Exit Door',
      'Exit Door', 'Ushering', 'Exit Door', 'Exit Door', 'End of class 5', 'Exit Door'
    ]
  },
  {
    name: 'Assistant 02 (Hallway Patrol)',
    role: 'TCA Staff',
    assignments: [
      'Corridor', 'Line up R2', 'Corridor', 'Corridor 2', 'Corridor', 'Corridor 2', 'End of class 2', 'Corridor',
      'Corridor 2', 'TCA Break', 'Line up R2',
      'Corridor', 'Corridor 2', 'Corridor', 'Corridor 2', 'End of class 3', 'Line up R3',
      'Corridor', 'Corridor 2', 'Corridor', 'Corridor 2', 'End of class 6', 'Corridor'
    ]
  },
  {
    name: 'Assistant 03 (Classroom Lead)',
    role: 'TCA Staff',
    assignments: [
      'Signs', 'Line up R3', 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3', '', '', '', 'End of class 3', 'Floating (2,3,4)',
      'TCA Break', 'Signs Exchange', 'Line up R3',
      'Primary Starter B (LP) Room 2 (Randa Mukhtar)', '', '', 'End of class 4', 'Line up R4', 'Signs Exchange',
      'Floating (2,3,4)', 'Corridor', 'Floating (5,6)', 'Signs Exchange', 'End of class 1', 'Signs'
    ]
  },
  {
    name: 'Assistant 04 (Floater Lead)',
    role: 'TCA Staff',
    assignments: [
      'Floating (2,3,4)', 'Line up R4', 'Floating (5,6)', 'Floating (2,3,4)', 'Floating (5,6)', 'Floating (2,3,4)', 'End of class 4', 'Waiting area',
      'Floating (5,6)', 'Floating (2,3,4)', 'TCA Break',
      'Floating (2,3,4)', 'TCA Break', 'Floating (5,6)', 'Floating (2,3,4)', 'End of class 5', 'Line up R5',
      'Floating (5,6)', 'Floating (2,3,4)', 'Floating (5,6)', 'Floating (2,3,4)', 'End of class 2', 'Waiting area'
    ]
  },
  {
    name: 'Assistant 05 (Helpdesk & Calls)',
    role: 'TCA Staff',
    assignments: [
      'Help desk/ Card creation', 'Line up R5', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'Help desk/CS support', 'End of class 5', 'Checking Home alone cards',
      'TCA Break', 'Help desk/ Card creation', 'Line up R4',
      'Help desk/CS support', 'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'End of class 6', 'Line up R6',
      'Attendance/Absent Calls', 'Card Checking and Calls', 'Checking Home alone cards', 'Help desk/ Card creation', 'End of class 3', 'Checking Home alone cards'
    ]
  },
  {
    name: 'Assistant 06 (Waiting & Reception)',
    role: 'TCA Staff',
    assignments: [
      'Waiting area', 'Line up R6', 'Inside Usher', 'Waiting area', 'Inside Usher', 'Waiting area', 'End of class 6', 'Waiting area',
      'Waiting area', 'Inside Usher', 'Line up R5',
      'TCA Break', 'Waiting area', 'Inside Usher', 'Waiting area', 'Inside Usher', 'Line up R1',
      'Waiting area', 'Inside Usher', 'TCA Break', 'Waiting area', 'End of class 4', 'Waiting area'
    ]
  }
];

// Helper to convert row data arrays into RotaTemplate format
const createTemplateFromRawRows = (
  id: string,
  name: string,
  description: string,
  category: 'standard' | 'early_shift' | 'late_shift' | 'weekend_peak' | 'skeleton' | 'custom',
  tag: string,
  rawRows: Array<{ name: string; role: string; assignments: string[] }>,
  targetMinCoverage: number = 6
): RotaTemplate => {
  const rows = rawRows.map(r => {
    const slots: Record<string, string> = {};
    TIME_SLOTS.forEach((slot, idx) => {
      slots[slot] = r.assignments[idx] || '';
    });
    return {
      name: r.name,
      role: r.role,
      slots
    };
  });

  let totalMinutes = 0;
  rows.forEach(r => {
    totalMinutes += calculateSlotsHours(r.slots) * 60;
  });
  const totalHours = totalMinutes / 60;
  const averageHoursPerStaff = rows.length > 0 ? totalHours / rows.length : 0;

  return {
    id,
    name,
    description,
    category,
    tag,
    isBuiltIn: true,
    staffCount: rows.length,
    targetMinCoverage,
    totalHours: Number(totalHours.toFixed(1)),
    averageHoursPerStaff: Number(averageHoursPerStaff.toFixed(1)),
    timeSlots: TIME_SLOTS,
    rows
  };
};

export const BUILT_IN_ROTA_TEMPLATES: RotaTemplate[] = [
  createTemplateFromRawRows(
    'template-standard-balanced',
    'Standard Weekday Operations',
    'Full balanced duty roster across all 12 TCA assistants with even duty rotation, starter classes, line-ups, and prayer breaks.',
    'standard',
    'Weekday Standard',
    STANDARD_BALANCED_ROWS,
    6
  ),
  createTemplateFromRawRows(
    'template-early-shift',
    'Early Shift Focus (Morning Peak)',
    'Heavy 09:00 – 14:30 staffing focused on morning arrival ushering, Starter Classrooms A & B, early line-ups R1–R6, and helpdesk setup.',
    'early_shift',
    'Early Shift (09:00 - 14:30)',
    EARLY_SHIFT_ROWS,
    7
  ),
  createTemplateFromRawRows(
    'template-late-shift',
    'Late Shift Focus (Afternoon & Evening)',
    'Heavy 12:00 – 18:30 staffing covering prayer break handover, end of classes 1–6, afternoon absent calls, home alone cards, and departure corridors.',
    'late_shift',
    'Late Shift (12:00 - 18:30)',
    LATE_SHIFT_ROWS,
    7
  ),
  createTemplateFromRawRows(
    'template-weekend-peak',
    'Weekend Peak (Maximum Coverage)',
    'High footfall configuration with dual helpdesk stations, maximum floater presence, constant exit door staffing, and complete line-up coordination.',
    'weekend_peak',
    'Weekend Peak (High Footfall)',
    WEEKEND_PEAK_ROWS,
    8
  ),
  createTemplateFromRawRows(
    'template-skeleton-crew',
    'Skeleton / Essential Coverage',
    'Minimal 6-staff lean deployment covering critical doors, essential corridor security, and centralized helpdesk support.',
    'skeleton',
    'Skeleton Crew (6 Staff)',
    SKELETON_ROWS,
    4
  )
];

// Single Staff Shift Patterns (Can be applied to any individual staff member)
export const BUILT_IN_STAFF_SHIFT_PATTERNS: StaffShiftPattern[] = [
  {
    id: 'pattern-early-shift',
    name: 'Early Shift Pattern',
    category: 'early',
    description: '09:00 – 14:00 (5.0 hrs). Morning arrival ushering, hallway patrols, line-ups, and compliant mid-morning 30m break.',
    iconName: 'Sun',
    color: '#38bdf8',
    shiftWindow: '09:00 - 14:00',
    totalHours: 4.5,
    breakMinutes: 30,
    slots: {
      '09:00 - 09:15': 'Ushering',
      '09:15 - 09:30': 'Line up R1',
      '09:30 - 10:00': 'Corridor',
      '10:00 - 10:30': 'Floating (2,3,4)',
      '10:30 - 11:00': 'Corridor 2',
      '11:00 - 11:30': 'TCA Break',
      '11:30 - 11:45': 'Exit Door',
      '11:45 - 12:00': 'Waiting area',
      '12:00 - 12:30': 'Floating (5,6)',
      '12:30 - 12:45': 'Line up R2',
      '12:45 - 01:00': 'Corridor',
      '01:00 - 01:30': 'Exit Door',
      '01:30 - 02:00': 'Waiting area',
      '02:00 - 02:30': '',
      '02:30 - 03:00': '',
      '03:00 - 03:15': '',
      '03:15 - 03:30': '',
      '03:30 - 04:00': '',
      '04:00 - 04:30': '',
      '04:30 - 05:00': '',
      '05:00 - 05:30': '',
      '05:30 - 06:00': '',
      '06:00 - 06:30': ''
    }
  },
  {
    id: 'pattern-late-shift',
    name: 'Late Shift Pattern',
    category: 'late',
    description: '12:30 – 18:30 (6.0 hrs). Afternoon prayer break handover, end of classes 1-6, absent calls, and departure security.',
    iconName: 'Moon',
    color: '#a855f7',
    shiftWindow: '12:30 - 18:30',
    totalHours: 5.5,
    breakMinutes: 30,
    slots: {
      '09:00 - 09:15': '',
      '09:15 - 09:30': '',
      '09:30 - 10:00': '',
      '10:00 - 10:30': '',
      '10:30 - 11:00': '',
      '11:00 - 11:30': '',
      '11:30 - 11:45': '',
      '11:45 - 12:00': '',
      '12:00 - 12:30': '',
      '12:30 - 12:45': 'Corridor',
      '12:45 - 01:00': 'Line up R3',
      '01:00 - 01:30': 'Primary Starter B (LP) Room 2 (Randa Mukhtar)',
      '01:30 - 02:00': 'Primary Starter B (LP) Room 2 (Randa Mukhtar)',
      '02:00 - 02:30': 'End of class 2',
      '02:30 - 03:00': 'Corridor',
      '03:00 - 03:15': 'Floating (5,6)',
      '03:15 - 03:30': 'TCA Break',
      '03:30 - 04:00': 'TCA Break',
      '04:00 - 04:30': 'Attendance/Absent Calls',
      '04:30 - 05:00': 'Card Checking and Calls',
      '05:00 - 05:30': 'Checking Home alone cards',
      '05:30 - 06:00': 'Exit Door',
      '06:00 - 06:30': 'End of class 6'
    }
  },
  {
    id: 'pattern-full-day',
    name: 'Full Day Standard Pattern',
    category: 'standard',
    description: '09:00 – 18:30 (7.5 hrs active). Balanced rotation across all 4 slot groups with scheduled prayer & rest breaks.',
    iconName: 'Clock',
    color: '#10b981',
    shiftWindow: '09:00 - 18:30',
    totalHours: 7.5,
    breakMinutes: 45,
    slots: {
      '09:00 - 09:15': 'Ushering',
      '09:15 - 09:30': 'Line up R6',
      '09:30 - 10:00': 'Floating (2,3,4)',
      '10:00 - 10:30': 'Corridor',
      '10:30 - 11:00': 'Floating (5,6)',
      '11:00 - 11:30': 'Corridor',
      '11:30 - 11:45': 'Exit Door',
      '11:45 - 12:00': '',
      '12:00 - 12:30': 'TCA Break',
      '12:30 - 12:45': 'Floating (5,6)',
      '12:45 - 01:00': 'Line up R1',
      '01:00 - 01:30': 'Primary Starter A (LP) Room 1(Kevin Sterling)',
      '01:30 - 02:00': 'Primary Starter A (LP) Room 1(Kevin Sterling)',
      '02:00 - 02:30': 'Exit Door',
      '02:30 - 03:00': 'Help desk/ Card creation',
      '03:00 - 03:15': 'Corridor 2',
      '03:15 - 03:30': 'Floating (2,3,4)',
      '03:30 - 04:00': 'Waiting area',
      '04:00 - 04:30': 'Corridor',
      '04:30 - 05:00': 'Exit Door',
      '05:00 - 05:30': 'Floating (5,6)',
      '05:30 - 06:00': 'End of class 5',
      '06:00 - 06:30': 'Corridor 2'
    }
  },
  {
    id: 'pattern-classroom-specialist',
    name: 'Classroom Specialist Pattern',
    category: 'specialist',
    description: 'Dedicated to Primary Starters A & B in morning/afternoon and End of Class transitions 1–6.',
    iconName: 'BookOpen',
    color: '#ec4899',
    shiftWindow: '09:00 - 17:30',
    totalHours: 6.5,
    breakMinutes: 30,
    slots: {
      '09:00 - 09:15': 'Signs',
      '09:15 - 09:30': 'Line up R1',
      '09:30 - 10:00': 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3',
      '10:00 - 10:30': 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3',
      '10:30 - 11:00': 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3',
      '11:00 - 11:30': 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3',
      '11:30 - 11:45': 'End of class 1',
      '11:45 - 12:00': 'Floating (2,3,4)',
      '12:00 - 12:30': 'TCA Break',
      '12:30 - 12:45': 'Corridor',
      '12:45 - 01:00': 'Line up R3',
      '01:00 - 01:30': 'Primary Starter B (LP) Room 2 (Randa Mukhtar)',
      '01:30 - 02:00': 'Primary Starter B (LP) Room 2 (Randa Mukhtar)',
      '02:00 - 02:30': 'End of class 2',
      '02:30 - 03:00': 'Line up R6',
      '03:00 - 03:15': 'End of class 4',
      '03:15 - 03:30': 'Corridor',
      '03:30 - 04:00': 'End of class 5',
      '04:00 - 04:30': 'End of class 3',
      '04:30 - 05:00': 'End of class 6',
      '05:00 - 05:30': '',
      '05:30 - 06:00': '',
      '06:00 - 06:30': ''
    }
  },
  {
    id: 'pattern-helpdesk-admin',
    name: 'Helpdesk & CS Support Pattern',
    category: 'specialist',
    description: 'Focused on Front Desk, Card Creation, Absent Calls, Home Alone Cards, and Signs Exchange.',
    iconName: 'Headphones',
    color: '#06b6d4',
    shiftWindow: '09:00 - 18:00',
    totalHours: 7.0,
    breakMinutes: 30,
    slots: {
      '09:00 - 09:15': 'Help desk/CS support',
      '09:15 - 09:30': 'Help desk/ Card creation',
      '09:30 - 10:00': 'Attendance/Absent Calls',
      '10:00 - 10:30': 'Card Checking and Calls',
      '10:30 - 11:00': 'Checking Home alone cards',
      '11:00 - 11:30': 'Help desk/CS support',
      '11:30 - 11:45': 'Waiting area',
      '11:45 - 12:00': 'Help desk/ Card creation',
      '12:00 - 12:30': 'TCA Break',
      '12:30 - 12:45': 'Help desk/CS support',
      '12:45 - 01:00': 'Signs Exchange',
      '01:00 - 01:30': 'Help desk/ Card creation',
      '01:30 - 02:00': 'Attendance/Absent Calls',
      '02:00 - 02:30': 'Card Checking and Calls',
      '02:30 - 03:00': 'Checking Home alone cards',
      '03:00 - 03:15': 'Signs Exchange',
      '03:15 - 03:30': 'Help desk/CS support',
      '03:30 - 04:00': 'Waiting area',
      '04:00 - 04:30': 'Attendance/Absent Calls',
      '04:30 - 05:00': 'Card Checking and Calls',
      '05:00 - 05:30': 'Checking Home alone cards',
      '05:30 - 06:00': 'Help desk/ Card creation',
      '06:00 - 06:30': ''
    }
  },
  {
    id: 'pattern-corridor-floater',
    name: 'Corridor & Floater Patrol Pattern',
    category: 'specialist',
    description: 'Active roving support across Corridors 1 & 2, Floating groups (2,3,4) & (5,6), and Door security.',
    iconName: 'Footprints',
    color: '#8b5cf6',
    shiftWindow: '09:00 - 18:30',
    totalHours: 7.2,
    breakMinutes: 45,
    slots: {
      '09:00 - 09:15': 'Corridor',
      '09:15 - 09:30': 'Corridor 2',
      '09:30 - 10:00': 'Floating (2,3,4)',
      '10:00 - 10:30': 'Floating (5,6)',
      '10:30 - 11:00': 'Corridor',
      '11:00 - 11:30': 'Corridor 2',
      '11:30 - 11:45': 'Exit Door',
      '11:45 - 12:00': 'Floating (2,3,4)',
      '12:00 - 12:30': 'TCA Break',
      '12:30 - 12:45': 'Floating (5,6)',
      '12:45 - 01:00': 'Corridor 2',
      '01:00 - 01:30': 'Floating (2,3,4)',
      '01:30 - 02:00': 'Floating (5,6)',
      '02:00 - 02:30': 'Corridor',
      '02:30 - 03:00': 'Exit Door',
      '03:00 - 03:15': 'Floating (2,3,4)',
      '03:15 - 03:30': 'Corridor 2',
      '03:30 - 04:00': 'Floating (5,6)',
      '04:00 - 04:30': 'Corridor',
      '04:30 - 05:00': 'Exit Door',
      '05:00 - 05:30': 'Floating (2,3,4)',
      '05:30 - 06:00': 'Floating (5,6)',
      '06:00 - 06:30': 'Corridor 2'
    }
  }
];
