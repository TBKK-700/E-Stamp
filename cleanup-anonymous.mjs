import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({
  credential: applicationDefault(),
  projectId: 'e-stamp-bc529',
});

const auth = getAuth();
const anonymousUids = [];
let pageToken;

do {
  const page = await auth.listUsers(1000, pageToken);
  for (const user of page.users) {
    const isAnonymous = !user.email
      && !user.phoneNumber
      && user.providerData.length === 0;
    if (isAnonymous) anonymousUids.push(user.uid);
  }
  pageToken = page.pageToken;
} while (pageToken);

console.log(`พบบัญชี anonymous จำนวน ${anonymousUids.length} บัญชี`);

if (!process.argv.includes('--delete')) {
  console.log('ยังไม่ได้ลบ หากจำนวนถูกต้องให้รัน: node cleanup-anonymous.mjs --delete');
  process.exit(0);
}

let deleted = 0;
let failed = 0;
for (let i = 0; i < anonymousUids.length; i += 1000) {
  const result = await auth.deleteUsers(anonymousUids.slice(i, i + 1000));
  deleted += result.successCount;
  failed += result.failureCount;
  for (const item of result.errors) {
    console.error(`ลบไม่สำเร็จ ลำดับ ${i + item.index}:`, item.error.message);
  }
}

console.log(`ลบสำเร็จ ${deleted} บัญชี, ไม่สำเร็จ ${failed} บัญชี`);
