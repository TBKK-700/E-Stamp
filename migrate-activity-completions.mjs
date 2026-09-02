import { execFileSync } from 'node:child_process';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const activityPoints = { risk: 5, kahoot: 5, bingo: 5, carbon: 20, supplier: 5 };

const credential = {
  async getAccessToken() {
    const accessToken = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
    return { access_token: accessToken, expires_in: 3600 };
  },
};

initializeApp({ credential, projectId: 'e-stamp-bc529' });
const db = getFirestore();

function bangkokDateKey(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value));
  const get = type => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function completionRecords(state, type) {
  const records = [], seen = new Set(), history = Array.isArray(state.scanHistory) ? state.scanHistory : [];
  history.filter(entry => entry?.type === type && entry?.activityId && entry?.scannedAt).forEach(entry => {
    const dateKey = entry.dateKey || bangkokDateKey(entry.scannedAt);
    const key = `${dateKey}_${entry.activityId}_${type}`;
    if (!seen.has(key)) {
      seen.add(key);
      records.push({ id: key, dateKey, activityId: entry.activityId, type, scannedAt: entry.scannedAt });
    }
  });
  const legacy = Array.isArray(state[type === 'join' ? 'joined' : 'wins']) ? state[type === 'join' ? 'joined' : 'wins'] : [];
  legacy.forEach(activityId => {
    if (!records.some(record => record.activityId === activityId)) {
      records.push({ id: null, dateKey: 'legacy', activityId, type, scannedAt: null });
    }
  });
  return records;
}

const participants = await db.collection('participants').get();
let batch = db.batch(), operations = 0, migratedParticipants = 0, createdCompletions = 0;

async function flush() {
  if (!operations) return;
  await batch.commit();
  batch = db.batch();
  operations = 0;
}

for (const participant of participants.docs) {
  const data = participant.data() || {}, state = data.state || {};
  const joins = completionRecords(state, 'join'), wins = completionRecords(state, 'win');
  const participationPoints = 5 + joins.reduce((sum, record) => sum + (activityPoints[record.activityId] || 0), 0);
  const winnerPoints = wins.length * 20;
  batch.set(participant.ref, { scores: { participationPoints, winnerPoints, totalPoints: participationPoints + winnerPoints, lastCompletionId: 'migration' } }, { merge: true });
  operations += 1;
  for (const record of [...joins, ...wins].filter(record => record.id)) {
    const ref = participant.ref.collection('activityCompletions').doc(record.id);
    batch.set(ref, {
      completionId: record.id, userId: participant.id, dateKey: record.dateKey,
      activityId: record.activityId, type: record.type,
      points: record.type === 'win' ? 20 : (activityPoints[record.activityId] || 0),
      source: 'history-migration', migrated: true,
      completedAt: Timestamp.fromDate(new Date(record.scannedAt)),
    }, { merge: false });
    operations += 1;
    createdCompletions += 1;
    if (operations >= 400) await flush();
  }
  migratedParticipants += 1;
  if (operations >= 400) await flush();
}
await flush();
console.log(JSON.stringify({ migratedParticipants, createdCompletions }));
