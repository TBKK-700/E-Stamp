import { execFileSync } from 'node:child_process';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.env.TARGET_UID?.trim();
const pin = process.env.NEW_PIN?.trim();

if (!uid) {
  console.error('ไม่พบ TARGET_UID กรุณาตั้งค่า UID ของพนักงานก่อน');
  process.exit(1);
}

if (!/^\d{6}$/.test(pin || '')) {
  console.error('PIN ต้องเป็นตัวเลข 6 หลัก');
  process.exit(1);
}

const cloudShellCredential = {
  async getAccessToken() {
    const accessToken = execFileSync(
      'gcloud',
      ['auth', 'print-access-token'],
      { encoding: 'utf8' },
    ).trim();

    if (!accessToken) throw new Error('Cloud Shell ไม่สามารถออก access token ได้');
    return { access_token: accessToken, expires_in: 3600 };
  },
};

initializeApp({
  credential: cloudShellCredential,
  projectId: 'e-stamp-bc529',
});

try {
  const user = await getAuth().updateUser(uid, { password: pin });
  console.log(`รีเซ็ต PIN สำเร็จ: ${user.email || user.uid}`);
} catch (error) {
  console.error('รีเซ็ต PIN ไม่สำเร็จ:', error.message);
  process.exitCode = 1;
} finally {
  delete process.env.NEW_PIN;
}
