import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('ไม่สามารถซิงค์ข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง', {
      cause: error,
    });
  }
}

export async function updateUserSheetSyncState(
  userId: number,
  payload: {
    googleSpreadsheetId?: string;
    googleSpreadsheetTitle?: string;
    googleSpreadsheetUrl?: string;
    lastSheetSyncAt?: string;
    lastSheetSyncStatus?: string;
    lastSheetSyncError?: string;
  }
) {
  try {
    const updateSet: Partial<typeof users.$inferInsert> = {};
    if (payload.googleSpreadsheetId !== undefined) {
      updateSet.googleSpreadsheetId = payload.googleSpreadsheetId;
    }
    if (payload.googleSpreadsheetTitle !== undefined) {
      updateSet.googleSpreadsheetTitle = payload.googleSpreadsheetTitle;
    }
    if (payload.googleSpreadsheetUrl !== undefined) {
      updateSet.googleSpreadsheetUrl = payload.googleSpreadsheetUrl;
    }
    if (payload.lastSheetSyncAt !== undefined) {
      updateSet.lastSheetSyncAt = payload.lastSheetSyncAt;
    }
    if (payload.lastSheetSyncStatus !== undefined) {
      updateSet.lastSheetSyncStatus = payload.lastSheetSyncStatus;
    }
    if (payload.lastSheetSyncError !== undefined) {
      updateSet.lastSheetSyncError = payload.lastSheetSyncError;
    }

    const [updated] = await db
      .update(users)
      .set(updateSet)
      .where(eq(users.id, userId))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('Database query failed in updateUserSheetSyncState:', error);
    throw new Error('ไม่สามารถบันทึกสถานะการซิงค์ Google Sheets ได้', {
      cause: error,
    });
  }
}
