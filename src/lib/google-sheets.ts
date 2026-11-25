import { EducationClaim, MedicalClaim, StaffProfile } from '../types/medical';
import {
  CLAIM_STATUS_LABELS,
  HOSPITAL_TYPE_LABELS,
  PATIENT_TYPE_LABELS,
  SPOUSE_STATUS_LABELS,
} from './thai-utils';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

const TAB_STAFF = 'ทะเบียนเจ้าหน้าที่';
const TAB_FORM_7131 = 'แบบ7131_รักษาพยาบาล';
const TAB_FORM_7223 = 'แบบ7223_การศึกษาบุตร';

export interface SheetSyncResult {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  syncedAt: string;
  totalRows: number;
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match?.[1]) return match[1];
  return trimmed;
}

async function parseGoogleError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const message = data?.error?.message;
    if (res.status === 401) {
      return 'สิทธิ์การเชื่อมต่อ Google Sheets หมดอายุ กรุณากดเชื่อมต่อใหม่อีกครั้ง';
    }
    if (res.status === 403) {
      return 'ไม่มีสิทธิ์เข้าถึงหรือแก้ไขไฟล์ Google Sheets นี้';
    }
    if (res.status === 404) {
      return 'ไม่พบไฟล์ Google Sheets ตามรหัสที่ระบุ';
    }
    return message ? `Google Sheets API: ${message}` : `HTTP ${res.status}`;
  } catch {
    return `เกิดข้อผิดพลาดจาก Google Sheets (${res.status})`;
  }
}

export async function verifySpreadsheetConnection(
  accessToken: string,
  spreadsheetIdInput: string
): Promise<{ spreadsheetId: string; title: string; url: string; sheetTitles: string[] }> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdInput);
  if (!spreadsheetId) {
    throw new Error('กรุณาระบุ Spreadsheet ID หรือ URL ของ Google Sheets');
  }

  const res = await fetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties.title`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(await parseGoogleError(res));
  }

  const data = await res.json();
  const sheetTitles: string[] = (data.sheets || [])
    .map((s: any) => s?.properties?.title)
    .filter(Boolean);

  return {
    spreadsheetId: data.spreadsheetId || spreadsheetId,
    title: data.properties?.title || 'Google Spreadsheet',
    url:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetTitles,
  };
}

export async function createWelfareSpreadsheet(
  accessToken: string,
  title = 'สสอ.ดอนพุด - ระบบใบเบิกเงินสวัสดิการ (7131 และ 7223)'
): Promise<{ spreadsheetId: string; title: string; url: string; sheetTitles: string[] }> {
  const res = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: TAB_STAFF } },
        { properties: { title: TAB_FORM_7131 } },
        { properties: { title: TAB_FORM_7223 } },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(await parseGoogleError(res));
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || title,
    url:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheetTitles: [TAB_STAFF, TAB_FORM_7131, TAB_FORM_7223],
  };
}

async function ensureRequiredTabs(
  accessToken: string,
  spreadsheetId: string,
  existingTitles: string[]
) {
  const requiredTabs = [TAB_STAFF, TAB_FORM_7131, TAB_FORM_7223];
  const missingTabs = requiredTabs.filter((t) => !existingTitles.includes(t));
  if (missingTabs.length === 0) return;

  const res = await fetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: missingTabs.map((title) => ({
          addSheet: {
            properties: { title },
          },
        })),
      }),
    }
  );

  if (!res.ok) {
    throw new Error(await parseGoogleError(res));
  }
}

export async function syncWelfareDataToGoogleSheets(params: {
  accessToken: string;
  spreadsheetId?: string;
  newSpreadsheetTitle?: string;
  staffList: StaffProfile[];
  claims: MedicalClaim[];
  educationClaims: EducationClaim[];
}): Promise<SheetSyncResult> {
  const {
    accessToken,
    spreadsheetId,
    newSpreadsheetTitle,
    staffList,
    claims,
    educationClaims,
  } = params;

  let targetMeta: {
    spreadsheetId: string;
    title: string;
    url: string;
    sheetTitles: string[];
  };

  if (spreadsheetId && extractSpreadsheetId(spreadsheetId)) {
    targetMeta = await verifySpreadsheetConnection(accessToken, spreadsheetId);
    await ensureRequiredTabs(accessToken, targetMeta.spreadsheetId, targetMeta.sheetTitles);
  } else {
    targetMeta = await createWelfareSpreadsheet(
      accessToken,
      newSpreadsheetTitle || 'สสอ.ดอนพุด - ระบบใบเบิกเงินสวัสดิการ (7131 และ 7223)'
    );
  }

  // Build tabular values
  const staffRows: (string | number)[][] = [
    [
      'รหัสเจ้าหน้าที่',
      'คำนำหน้า',
      'ชื่อ-สกุล',
      'เลขประจำตัวประชาชน',
      'ตำแหน่ง',
      'สังกัด',
      'กลุ่มงาน / รพ.สต.',
      'โทรศัพท์',
      'ธนาคาร',
      'เลขที่บัญชี',
      'จำนวนบุคคลในครอบครัว',
      'จำนวนใบเบิก 7131',
      'จำนวนใบเบิก 7223',
    ],
    ...staffList.map((s) => [
      s.staffCode,
      s.prefix,
      s.fullName,
      s.nationalId,
      s.position,
      s.affiliation,
      s.department,
      s.phone || '',
      s.bankName || '',
      s.bankAccount || '',
      s.dependents?.length || 0,
      s.claimCount ?? 0,
      s.educationClaimCount ?? 0,
    ]),
  ];

  const form7131Rows: (string | number)[][] = [
    [
      'เลขที่ใบเบิก',
      'ปีงบประมาณ',
      'วันที่ยื่นเบิก',
      'ชื่อผู้ขอเบิก',
      'ตำแหน่ง',
      'สังกัด',
      'ประเภทผู้ป่วย',
      'ชื่อผู้ป่วย',
      'โรค / การวินิจฉัย',
      'สถานพยาบาล',
      'ประเภทสถานพยาบาล',
      'จำนวนใบเสร็จ',
      'ยอดใบเสร็จ (บาท)',
      'ยอดเบิกตามสิทธิ (บาท)',
      'สถานะ',
      'ผู้อนุมัติ',
    ],
    ...claims.map((c) => [
      c.claimNumber,
      c.fiscalYear,
      c.claimDate,
      c.claimantName,
      c.claimantPosition,
      c.claimantAffiliation,
      PATIENT_TYPE_LABELS[c.patientType] || c.patientType,
      c.patientType === 'self' ? c.claimantName : c.patientName || '',
      c.diagnosis,
      c.hospitalName,
      HOSPITAL_TYPE_LABELS[c.hospitalType] || c.hospitalType,
      c.receiptCount,
      Number(c.totalAmount),
      Number(c.claimableAmount),
      CLAIM_STATUS_LABELS[c.status] || c.status,
      c.approverName || '',
    ]),
  ];

  const form7223Rows: (string | number)[][] = [
    [
      'เลขที่ใบเบิก',
      'ปีงบประมาณ',
      'ปีการศึกษา',
      'ภาคเรียน',
      'วันที่ยื่นเบิก',
      'ชื่อผู้ขอเบิก',
      'ตำแหน่ง',
      'สังกัด',
      'ชื่อคู่สมรส',
      'สถานะคู่สมรส',
      'จำนวนบุตร',
      'รายชื่อบุตร / สถานศึกษา / ชั้นเรียน',
      'ยอดจ่ายจริง (บาท)',
      'ยอดเบิกตามสิทธิ (บาท)',
      'สถานะ',
      'ผู้อนุมัติ',
    ],
    ...educationClaims.map((c) => [
      c.claimNumber,
      c.fiscalYear,
      c.academicYear,
      c.semester,
      c.claimDate,
      c.claimantName,
      c.claimantPosition,
      c.claimantAffiliation,
      c.spouseName || '',
      SPOUSE_STATUS_LABELS[c.spouseStatus] || c.spouseStatus,
      c.children.length,
      c.children
        .map((ch) => `${ch.childName} (${ch.schoolName} - ${ch.gradeLevel})`)
        .join(' | '),
      Number(c.totalAmount),
      Number(c.claimableAmount),
      CLAIM_STATUS_LABELS[c.status] || c.status,
      c.approverName || '',
    ]),
  ];

  // Clear existing ranges first so deleted records don't linger
  const clearRes = await fetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(targetMeta.spreadsheetId)}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: [
          `'${TAB_STAFF}'!A:Z`,
          `'${TAB_FORM_7131}'!A:Z`,
          `'${TAB_FORM_7223}'!A:Z`,
        ],
      }),
    }
  );

  if (!clearRes.ok) {
    throw new Error(await parseGoogleError(clearRes));
  }

  const updateRes = await fetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(targetMeta.spreadsheetId)}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `'${TAB_STAFF}'!A1`, values: staffRows },
          { range: `'${TAB_FORM_7131}'!A1`, values: form7131Rows },
          { range: `'${TAB_FORM_7223}'!A1`, values: form7223Rows },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    throw new Error(await parseGoogleError(updateRes));
  }

  return {
    spreadsheetId: targetMeta.spreadsheetId,
    spreadsheetTitle: targetMeta.title,
    spreadsheetUrl: targetMeta.url,
    syncedAt: new Date().toISOString(),
    totalRows: staffList.length + claims.length + educationClaims.length,
  };
}
