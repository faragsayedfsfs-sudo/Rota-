import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Lazy initialization of GoogleGenAI
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

interface SuggestSlotRequestBody {
  slot: string;
  staffId: string;
  staffName: string;
  staffRole?: string;
  staffSkills?: string[];
  staffNotes?: string;
  staffScheduledDuties?: string[];
  teamDutiesInSlot?: string[];
  allActivities?: Array<{ id: string; name: string; shortCode: string; category?: string; isBreak?: boolean; isWorking?: boolean }>;
  breakStatus?: {
    totalBreakMinutes: number;
    needsBreak: boolean;
    isMandatoryBreakWindow: boolean;
  };
}

interface SmartFillRequestBody {
  rotaTitle?: string;
  timeSlots: string[];
  rows: Array<{
    id: string;
    name: string;
    role: string;
    skills?: string[];
    notes?: string;
    slots: Record<string, string>;
  }>;
  availableActivities: Array<{ id: string; name: string; shortCode: string; category?: string; isBreak?: boolean; isWorking?: boolean }>;
  targetSlotGroup?: string;
}

// Built-in heuristic suggestion generator (for fast offline / immediate responses)
function generateHeuristicSuggestions(reqData: SuggestSlotRequestBody) {
  const { slot, staffName, staffNotes, staffScheduledDuties = [], teamDutiesInSlot = [], allActivities = [], breakStatus } = reqData;
  const isBreakSlot = slot.includes('12:00') || slot.includes('12:30') || slot.includes('12:45') || slot.includes('01:00');
  const needsBreak = breakStatus?.needsBreak || (isBreakSlot && (breakStatus?.totalBreakMinutes || 0) < 30);
  const notesLower = (staffNotes || '').toLowerCase();
  const requiresQuiet = notesLower.includes('quiet') || notesLower.includes('desk') || notesLower.includes('support');
  const isPartTime = notesLower.includes('part-time') || notesLower.includes('part time') || notesLower.includes('short');

  const suggestions = [];

  // 1. Break priority if needed
  if (needsBreak && isBreakSlot) {
    const breakAct = allActivities.find(a => a.isBreak || a.name.toLowerCase().includes('break')) || {
      id: 'PRAYER_LUNCH_BREAK',
      name: 'Prayer & Lunch Break',
      shortCode: 'Prayer/Lunch Break'
    };
    suggestions.push({
      activityId: breakAct.id,
      activityName: breakAct.name,
      shortCode: breakAct.shortCode || breakAct.name,
      confidenceScore: 98,
      reason: `Mandatory 30-minute rest & prayer window compliance for ${staffName}.`,
      isBreak: true
    });
  }

  // 2. Filter duties already saturated in team
  const unassignedActs = allActivities.filter(a => {
    if (a.isBreak) return false;
    const countInSlot = teamDutiesInSlot.filter(t => t.toLowerCase() === a.name.toLowerCase() || t.toLowerCase() === (a.shortCode || '').toLowerCase()).length;
    return countInSlot === 0;
  });

  // 3. Workload variety: pick duties staff hasn't done repeatedly
  const dutyFrequency: Record<string, number> = {};
  staffScheduledDuties.forEach(d => {
    dutyFrequency[d] = (dutyFrequency[d] || 0) + 1;
  });

  // Sort activities by least recently / least frequently assigned to this staff
  const preferredActivities = (unassignedActs.length > 0 ? unassignedActs : allActivities.filter(a => !a.isBreak))
    .sort((a, b) => {
      const freqA = dutyFrequency[a.name] || dutyFrequency[a.shortCode] || 0;
      const freqB = dutyFrequency[b.name] || dutyFrequency[b.shortCode] || 0;
      return freqA - freqB;
    });

  // Match notes preferences
  let topMatches = preferredActivities;
  if (requiresQuiet) {
    topMatches = [
      ...preferredActivities.filter(a => (a.category || '').includes('Admin') || a.name.includes('Desk') || a.name.includes('Backoffice')),
      ...preferredActivities.filter(a => !(a.category || '').includes('Admin') && !a.name.includes('Desk'))
    ];
  }

  topMatches.slice(0, 3).forEach((act, idx) => {
    if (suggestions.some(s => s.activityId === act.id)) return;
    const baseScore = 92 - idx * 7 - (isPartTime ? 3 : 0);
    suggestions.push({
      activityId: act.id,
      activityName: act.name,
      shortCode: act.shortCode || act.name,
      confidenceScore: Math.max(65, baseScore),
      reason: `Optimal team coverage balance; avoids back-to-back duty fatigue for ${staffName}${staffNotes ? ` (${staffNotes})` : ''}.`,
      isBreak: false
    });
  });

  return suggestions.slice(0, 3);
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Smart Suggest for Single Empty Shift Slot
  app.post('/api/suggest-slot', async (req, res) => {
    try {
      const body: SuggestSlotRequestBody = req.body;
      const { slot, staffName, staffRole, staffSkills = [], staffNotes, staffScheduledDuties = [], teamDutiesInSlot = [], allActivities = [], breakStatus } = body;

      const ai = getAi();
      if (!ai) {
        // Fallback to high-quality heuristic engine if API key is not yet configured
        const fallbackSuggestions = generateHeuristicSuggestions(body);
        return res.json({
          source: 'heuristic',
          suggestions: fallbackSuggestions
        });
      }

      const prompt = `You are an expert workforce management and hospital/clinic/academy rota optimization assistant.
Analyze this shift assignment request and recommend the top 3 best duties for the staff member in this time slot.

Context:
- Slot: ${slot}
- Staff Member: ${staffName} (${staffRole || 'TCA Assistant'})
- Staff Skills / Certifications: ${staffSkills.length > 0 ? staffSkills.join(', ') : 'General duties'}
- Staff Custom Notes / Preferences: ${staffNotes || 'None'}
- Staff's other duties scheduled today: ${JSON.stringify(staffScheduledDuties)}
- Other team members' assigned duties in this slot (avoid duplicate clashes unless necessary): ${JSON.stringify(teamDutiesInSlot)}
- Break Status: Total break: ${breakStatus?.totalBreakMinutes || 0} mins. Needs break: ${breakStatus?.needsBreak ? 'YES' : 'NO'}. Mandatory prayer/lunch window: ${breakStatus?.isMandatoryBreakWindow ? 'YES' : 'NO'}.
- Available Activities List: ${JSON.stringify(allActivities.map(a => ({ id: a.id, name: a.name, shortCode: a.shortCode, category: a.category, isBreak: a.isBreak })))}

Optimization Rules:
1. If staff is in the 12:00-13:30 prayer/lunch break window and has less than 30 mins break, prioritize recommending rest/prayer break.
2. Consider staff skills (e.g. 'First Aid', 'Bilingual', 'Senior', 'Team Lead', 'Reception') and align tasks where their capabilities add highest value.
3. Respect staff custom notes (e.g., 'Requires quiet environment', 'Part-time', 'Prefers Floor 1').
4. Ensure balanced duty rotation to prevent burnout (rotate between active corridor/intake and desk/support duties).
5. Return exactly top 3 distinct recommendations with confidence score (50-100) and a concise, helpful explanation why this activity fits best.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an intelligent shift rota optimization AI. Output concise, actionable recommendations in valid JSON format matching the responseSchema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    activityId: { type: Type.STRING, description: 'ID matching one of the available activities' },
                    activityName: { type: Type.STRING, description: 'Full name of the activity' },
                    shortCode: { type: Type.STRING, description: 'Short badge code or label' },
                    confidenceScore: { type: Type.NUMBER, description: 'Match confidence percentage (50 to 100)' },
                    reason: { type: Type.STRING, description: 'Short 1-sentence rationale for the recommendation' },
                    isBreak: { type: Type.BOOLEAN, description: 'Whether this is a rest/lunch break' }
                  },
                  required: ['activityId', 'activityName', 'shortCode', 'confidenceScore', 'reason']
                }
              }
            },
            required: ['suggestions']
          }
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      const suggestions = (parsed.suggestions && parsed.suggestions.length > 0)
        ? parsed.suggestions
        : generateHeuristicSuggestions(body);

      res.json({
        source: 'gemini',
        suggestions
      });
    } catch (err: any) {
      console.warn('Gemini Suggest API error, using heuristic fallback:', err?.message || err);
      const fallbackSuggestions = generateHeuristicSuggestions(req.body);
      res.json({
        source: 'heuristic-fallback',
        suggestions: fallbackSuggestions
      });
    }
  });

  // AI Smart Auto-Fill for Entire Rota or Empty Slots
  app.post('/api/smart-fill-rota', async (req, res) => {
    try {
      const body: SmartFillRequestBody = req.body;
      const { timeSlots, rows, availableActivities = [] } = body;

      const ai = getAi();
      if (!ai) {
        // Fast deterministic auto-fill fallback
        const updatedRows = rows.map(row => {
          const newSlots = { ...row.slots };
          const workingActs = availableActivities.filter(a => !a.isBreak);
          const breakAct = availableActivities.find(a => a.isBreak) || { id: 'PRAYER_LUNCH_BREAK', name: 'Prayer & Lunch Break', shortCode: 'Break' };
          
          let actIndex = 0;
          let hasBreak = Object.values(newSlots).some(v => v.toLowerCase().includes('break'));

          timeSlots.forEach(slot => {
            if (!newSlots[slot] || newSlots[slot].trim() === '' || newSlots[slot] === 'OFF') {
              if (!hasBreak && (slot.includes('12:00') || slot.includes('12:30') || slot.includes('01:00'))) {
                newSlots[slot] = breakAct.shortCode || breakAct.name;
                hasBreak = true;
              } else if (workingActs.length > 0) {
                const act = workingActs[actIndex % workingActs.length];
                newSlots[slot] = act.shortCode || act.name;
                actIndex++;
              }
            }
          });
          return { ...row, slots: newSlots };
        });

        return res.json({
          source: 'heuristic',
          rows: updatedRows,
          summary: 'Auto-filled empty slots with balanced duty rotation and prayer/lunch break compliance.'
        });
      }

      const prompt = `Optimize and populate empty slots in this shift rota:
- Time Slots: ${JSON.stringify(timeSlots)}
- Available Activities: ${JSON.stringify(availableActivities.map(a => a.shortCode || a.name))}
- Staff Rows (with existing slots and notes): ${JSON.stringify(rows.map(r => ({ id: r.id, name: r.name, notes: r.notes, slots: r.slots })))}

Rules:
1. Retain all non-empty pre-existing slot assignments.
2. Fill all empty slots with realistic, balanced duties.
3. Ensure each active staff has at least 30 minutes of rest/lunch break in the 12:00-13:30 window.
4. Respect staff notes (e.g. part-time, quiet environments).
5. Output updated rows with complete slots dictionary for each staff member.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an intelligent workforce schedule planner. Return the complete populated schedule JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'Summary of optimization actions applied' },
              rows: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    slots: {
                      type: Type.OBJECT,
                      description: 'Map of slot name to assigned duty name/shortCode'
                    }
                  },
                  required: ['id', 'slots']
                }
              }
            },
            required: ['rows', 'summary']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        source: 'gemini',
        rows: parsed.rows || rows,
        summary: parsed.summary || 'Optimized schedule generated successfully.'
      });
    } catch (err: any) {
      console.warn('Smart Fill API error:', err?.message || err);
      res.status(500).json({ error: 'Failed to auto-fill rota', message: err?.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
