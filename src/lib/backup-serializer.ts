export type BackupTableName =
  | 'users'
  | 'staff_profiles'
  | 'staff_dependents'
  | 'medical_claims'
  | 'claim_receipts'
  | 'education_claims'
  | 'education_claim_children';

export interface DatabaseBackupPayload {
  users: Record<string, unknown>[];
  staff_profiles: Record<string, unknown>[];
  staff_dependents: Record<string, unknown>[];
  medical_claims: Record<string, unknown>[];
  claim_receipts: Record<string, unknown>[];
  education_claims: Record<string, unknown>[];
  education_claim_children: Record<string, unknown>[];
}

interface ColumnDef {
  jsKey: string;
  sqlCol: string;
}

const TABLE_COLUMNS: Record<BackupTableName, ColumnDef[]> = {
  users: [
    { jsKey: 'id', sqlCol: 'id' },
    { jsKey: 'uid', sqlCol: 'uid' },
    { jsKey: 'email', sqlCol: 'email' },
    { jsKey: 'displayName', sqlCol: 'display_name' },
    { jsKey: 'role', sqlCol: 'role' },
    { jsKey: 'googleSpreadsheetId', sqlCol: 'google_spreadsheet_id' },
    { jsKey: 'googleSpreadsheetTitle', sqlCol: 'google_spreadsheet_title' },
    { jsKey: 'googleSpreadsheetUrl', sqlCol: 'google_spreadsheet_url' },
    { jsKey: 'lastSheetSyncAt', sqlCol: 'last_sheet_sync_at' },
    { jsKey: 'lastSheetSyncStatus', sqlCol: 'last_sheet_sync_status' },
    { jsKey: 'lastSheetSyncError', sqlCol: 'last_sheet_sync_error' },
    { jsKey: 'createdAt', sqlCol: 'created_at' },
  ],
  staff_profiles: [
    { jsKey: 'id', sqlCol: 'id' },
    { jsKey: 'userId', sqlCol: 'user_id' },
    { jsKey: 'staffCode', sqlCol: 'staff_code' },
    { jsKey: 'prefix', sqlCol: 'prefix' },
    { jsKey: 'fullName', sqlCol: 'full_name' },
    { jsKey: 'nationalId', sqlCol: 'national_id' },
    { jsKey: 'position', sqlCol: 'position' },
    { jsKey: 'affiliation', sqlCol: 'affiliation' },
    { jsKey: 'department', sqlCol: 'department' },
    { jsKey: 'phone', sqlCol: 'phone' },
    { jsKey: 'bankName', sqlCol: 'bank_name' },
    { jsKey: 'bankAccount', sqlCol: 'bank_account' },
    { jsKey: 'createdAt', sqlCol: 'created_at' },
    { jsKey: 'updatedAt', sqlCol: 'updated_at' },
  ],
  staff_dependents: [
    { jsKey: 'id', sqlCol: 'id' },
    { jsKey: 'staffId', sqlCol: 'staff_id' },
    { jsKey: 'relationship', sqlCol: 'relationship' },
    { jsKey: 'fullName', sqlCol: 'full_name' },
    { jsKey: 'nationalId', sqlCol: 'national_id' },
    { jsKey: 'birthDate', sqlCol: 'birth_date' },
    { jsKey: 'childOrder', sqlCol: 'child_order' },
    { jsKey: 'isMinor', sqlCol: 'is_minor' },
    { jsKey: 'isIncapacitated', sqlCol: 'is_incapacitated' },
    { jsKey: 'createdAt', sqlCol: 'created_at' },
  ],
  medical_claims: [
    { jsKey: 'id', sqlCol: 'id' },
    { jsKey: 'userId', sqlCol: 'user_id' },
    { jsKey: 'staffId', sqlCol: 'staff_id' },
    { jsKey: 'claimNumber', sqlCol: 'claim_number' },
    { jsKey: 'fiscalYear', sqlCol: 'fiscal_year' },
    { jsKey: 'claimDate', sqlCol: 'claim_date' },
    { jsKey: 'claimantName', sqlCol: 'claimant_name' },
    { jsKey: 'claimantPosition', sqlCol: 'claimant_position' },
    { jsKey: 'claimantAffiliation', sqlCol: 'claimant_affiliation' },
    { jsKey: 'patientType', sqlCol: 'patient_type' },
    { jsKey: 'patientName', sqlCol: 'patient_name' },
    { jsKey: 'patientNationalId', sqlCol: 'patient_national_id' },
    { jsKey: 'childBirthDate', sqlCol: 'child_birth_date' },
    { jsKey: 'childOrder', sqlCol: 'child_order' },
    { jsKey: 'isMinor', sqlCol: 'is_minor' },
    { jsKey: 'isIncapacitated', sqlCol: 'is_incapacitated' },
    { jsKey: 'diagnosis', sqlCol: 'diagnosis' },
    { jsKey: 'hospitalName', sqlCol: 'hospital_name' },
    { jsKey: 'hospitalType', sqlCol: 'hospital_type' },
    { jsKey: 'treatmentStartDate', sqlCol: 'treatment_start_date' },
    { jsKey: 'treatmentEndDate', sqlCol: 'treatment_end_date' },
    { jsKey: 'totalAmount', sqlCol: 'total_amount' },
    { jsKey: 'totalAmountText', sqlCol: 'total_amount_text' },
    { jsKey: 'receiptCount', sqlCol: 'receipt_count' },
    { jsKey: 'entitlementBasis', sqlCol: 'entitlement_basis' },
    { jsKey: 'claimableAmount', sqlCol: 'claimable_amount' },
    { jsKey: 'claimableAmountText', sqlCol: 'claimable_amount_text' },
    { jsKey: 'selfRightsOption', sqlCol: 'self_rights_option' },
    { jsKey: 'relatedPersonRole', sqlCol: 'related_person_role' },
    { jsKey: 'relatedRightsOption', sqlCol: 'related_rights_option' },
    { jsKey: 'status', sqlCol: 'status' },
    { jsKey: 'approverName', sqlCol: 'approver_name' },
    { jsKey: 'approverPosition', sqlCol: 'approver_position' },
    { jsKey: 'approvedDate', sqlCol: 'approved_date' },
    { jsKey: 'notes', sqlCol: 'notes' },
    { jsKey: 'createdAt', sqlCol: 'created_at' },
    { jsKey: 'updatedAt', sqlCol: 'updated_at' },
  ],
  claim_receipts: [
    { jsKey: 'id', sqlCol: 'id' },
    { jsKey: 'claimId', sqlCol: 'claim_id' },
    { jsKey: 'receiptNumber', sqlCol: 'receipt_number' },
    { jsKey: 'receiptDate', sqlCol: 'receipt_date' },
    { jsKey: 'category', sqlCol: 'category' },
    { jsKey: 'description', sqlCol: 'description' },
    { jsKey: 'amount', sqlCol: 'amount' },
    { jsKey: 'createdAt', sqlCol: 'created_at' },
  ],
  education_claims: [
    { jsKey: 'id', sqlCol: 'id' },
    { jsKey: 'userId', sqlCol: 'user_id' },
    { jsKey: 'staffId', sqlCol: 'staff_id' },
    { jsKey: 'claimNumber', sqlCol: 'claim_number' },
    { jsKey: 'fiscalYear', sqlCol: 'fiscal_year' },
    { jsKey: 'academicYear', sqlCol: 'academic_year' },
    { jsKey: 'semester', sqlCol: 'semester' },
    { jsKey: 'claimDate', sqlCol: 'claim_date' },
    { jsKey: 'claimantName', sqlCol: 'claimant_name' },
    { jsKey: 'claimantPosition', sqlCol: 'claimant_position' },
    { jsKey: 'claimantAffiliation', sqlCol: 'claimant_affiliation' },
    { jsKey: 'spouseName', sqlCol: 'spouse_name' },
    { jsKey: 'spouseStatus', sqlCol: 'spouse_status' },
    { jsKey: 'spousePosition', sqlCol: 'spouse_position' },
    { jsKey: 'spouseAffiliation', sqlCol: 'spouse_affiliation' },
    { jsKey: 'claimantRole', sqlCol: 'claimant_role' },
    { jsKey: 'totalAmount', sqlCol: 'total_amount' },
    { jsKey: 'totalAmountText', sqlCol: 'total_amount_text' },
    { jsKey: 'entitlementBasis', sqlCol: 'entitlement_basis' },
    { jsKey: 'claimableAmount', sqlCol: 'claimable_amount' },
    { jsKey: 'claimableAmountText', sqlCol: 'claimable_amount_text' },
    { jsKey: 'certHasRight', sqlCol: 'cert_has_right' },
    { jsKey: 'certChildEligible', sqlCol: 'cert_child_eligible' },
    { jsKey: 'certSoleClaimant', sqlCol: 'cert_sole_claimant' },
    { jsKey: 'certSpouseLowerBenefit', sqlCol: 'cert_spouse_lower_benefit' },
    { jsKey: 'spouseLowerAmount', sqlCol: 'spouse_lower_amount' },
    { jsKey: 'status', sqlCol: 'status' },
    { jsKey: 'approverName', sqlCol: 'approver_name' },
    { jsKey: 'approverPosition', sqlCol: 'approver_position' },
    { jsKey: 'approvedDate', sqlCol: 'approved_date' },
    { jsKey: 'notes', sqlCol: 'notes' },
    { jsKey: 'createdAt', sqlCol: 'created_at' },
    { jsKey: 'updatedAt', sqlCol: 'updated_at' },
  ],
  education_claim_children: [
    { jsKey: 'id', sqlCol: 'id' },
    { jsKey: 'educationClaimId', sqlCol: 'education_claim_id' },
    { jsKey: 'dependentId', sqlCol: 'dependent_id' },
    { jsKey: 'childOrderIndex', sqlCol: 'child_order_index' },
    { jsKey: 'childName', sqlCol: 'child_name' },
    { jsKey: 'childBirthDate', sqlCol: 'child_birth_date' },
    { jsKey: 'fatherChildOrder', sqlCol: 'father_child_order' },
    { jsKey: 'motherChildOrder', sqlCol: 'mother_child_order' },
    { jsKey: 'replacingDeceasedOrder', sqlCol: 'replacing_deceased_order' },
    { jsKey: 'deceasedChildName', sqlCol: 'deceased_child_name' },
    { jsKey: 'deceasedChildBirthDate', sqlCol: 'deceased_child_birth_date' },
    { jsKey: 'deceasedChildDeathDate', sqlCol: 'deceased_child_death_date' },
    { jsKey: 'schoolName', sqlCol: 'school_name' },
    { jsKey: 'schoolDistrict', sqlCol: 'school_district' },
    { jsKey: 'schoolProvince', sqlCol: 'school_province' },
    { jsKey: 'gradeLevel', sqlCol: 'grade_level' },
    { jsKey: 'isMaintenanceFee', sqlCol: 'is_maintenance_fee' },
    { jsKey: 'isTuitionFee', sqlCol: 'is_tuition_fee' },
    { jsKey: 'amount', sqlCol: 'amount' },
    { jsKey: 'receiptNumber', sqlCol: 'receipt_number' },
    { jsKey: 'receiptDate', sqlCol: 'receipt_date' },
    { jsKey: 'createdAt', sqlCol: 'created_at' },
  ],
};

const TABLE_ORDER: BackupTableName[] = [
  'users',
  'staff_profiles',
  'staff_dependents',
  'medical_claims',
  'claim_receipts',
  'education_claims',
  'education_claim_children',
];

const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "uid" text NOT NULL UNIQUE,
  "email" text NOT NULL,
  "display_name" text DEFAULT '',
  "role" text DEFAULT 'staff' NOT NULL,
  "google_spreadsheet_id" text DEFAULT '',
  "google_spreadsheet_title" text DEFAULT '',
  "google_spreadsheet_url" text DEFAULT '',
  "last_sheet_sync_at" text DEFAULT '',
  "last_sheet_sync_status" text DEFAULT 'idle',
  "last_sheet_sync_error" text DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "staff_code" text NOT NULL,
  "prefix" text DEFAULT '' NOT NULL,
  "full_name" text NOT NULL,
  "national_id" text NOT NULL,
  "position" text NOT NULL,
  "affiliation" text DEFAULT 'สำนักงานสาธารณสุขอำเภอดอนพุด' NOT NULL,
  "department" text DEFAULT '' NOT NULL,
  "phone" text DEFAULT '',
  "bank_name" text DEFAULT '',
  "bank_account" text DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_dependents" (
  "id" serial PRIMARY KEY NOT NULL,
  "staff_id" integer NOT NULL REFERENCES "staff_profiles"("id") ON DELETE cascade,
  "relationship" text NOT NULL,
  "full_name" text NOT NULL,
  "national_id" text NOT NULL,
  "birth_date" text DEFAULT '',
  "child_order" integer,
  "is_minor" boolean DEFAULT false,
  "is_incapacitated" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "medical_claims" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "staff_id" integer NOT NULL REFERENCES "staff_profiles"("id") ON DELETE restrict,
  "claim_number" text NOT NULL,
  "fiscal_year" text NOT NULL,
  "claim_date" text NOT NULL,
  "claimant_name" text NOT NULL,
  "claimant_position" text NOT NULL,
  "claimant_affiliation" text NOT NULL,
  "patient_type" text NOT NULL,
  "patient_name" text DEFAULT '',
  "patient_national_id" text DEFAULT '',
  "child_birth_date" text DEFAULT '',
  "child_order" integer,
  "is_minor" boolean DEFAULT false,
  "is_incapacitated" boolean DEFAULT false,
  "diagnosis" text NOT NULL,
  "hospital_name" text NOT NULL,
  "hospital_type" text NOT NULL,
  "treatment_start_date" text NOT NULL,
  "treatment_end_date" text NOT NULL,
  "total_amount" numeric(12, 2) NOT NULL,
  "total_amount_text" text NOT NULL,
  "receipt_count" integer DEFAULT 1 NOT NULL,
  "entitlement_basis" text NOT NULL,
  "claimable_amount" numeric(12, 2) NOT NULL,
  "claimable_amount_text" text NOT NULL,
  "self_rights_option" text NOT NULL,
  "related_person_role" text DEFAULT '',
  "related_rights_option" text DEFAULT '',
  "status" text DEFAULT 'submitted' NOT NULL,
  "approver_name" text DEFAULT '',
  "approver_position" text DEFAULT '',
  "approved_date" text DEFAULT '',
  "notes" text DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "claim_receipts" (
  "id" serial PRIMARY KEY NOT NULL,
  "claim_id" integer NOT NULL REFERENCES "medical_claims"("id") ON DELETE cascade,
  "receipt_number" text NOT NULL,
  "receipt_date" text NOT NULL,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "education_claims" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "staff_id" integer NOT NULL REFERENCES "staff_profiles"("id") ON DELETE restrict,
  "claim_number" text NOT NULL,
  "fiscal_year" text NOT NULL,
  "academic_year" text DEFAULT '2569' NOT NULL,
  "semester" text DEFAULT '1' NOT NULL,
  "claim_date" text NOT NULL,
  "claimant_name" text NOT NULL,
  "claimant_position" text NOT NULL,
  "claimant_affiliation" text NOT NULL,
  "spouse_name" text DEFAULT '',
  "spouse_status" text DEFAULT 'not_gov' NOT NULL,
  "spouse_position" text DEFAULT '',
  "spouse_affiliation" text DEFAULT '',
  "claimant_role" text DEFAULT 'lawful_father' NOT NULL,
  "total_amount" numeric(12, 2) NOT NULL,
  "total_amount_text" text NOT NULL,
  "entitlement_basis" text DEFAULT 'full' NOT NULL,
  "claimable_amount" numeric(12, 2) NOT NULL,
  "claimable_amount_text" text NOT NULL,
  "cert_has_right" boolean DEFAULT true NOT NULL,
  "cert_child_eligible" boolean DEFAULT true NOT NULL,
  "cert_sole_claimant" boolean DEFAULT false NOT NULL,
  "cert_spouse_lower_benefit" boolean DEFAULT false NOT NULL,
  "spouse_lower_amount" numeric(12, 2) DEFAULT '0.00',
  "status" text DEFAULT 'submitted' NOT NULL,
  "approver_name" text DEFAULT '',
  "approver_position" text DEFAULT '',
  "approved_date" text DEFAULT '',
  "notes" text DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "education_claim_children" (
  "id" serial PRIMARY KEY NOT NULL,
  "education_claim_id" integer NOT NULL REFERENCES "education_claims"("id") ON DELETE cascade,
  "dependent_id" integer REFERENCES "staff_dependents"("id") ON DELETE set null,
  "child_order_index" integer DEFAULT 1 NOT NULL,
  "child_name" text NOT NULL,
  "child_birth_date" text DEFAULT '',
  "father_child_order" integer,
  "mother_child_order" integer,
  "replacing_deceased_order" integer,
  "deceased_child_name" text DEFAULT '',
  "deceased_child_birth_date" text DEFAULT '',
  "deceased_child_death_date" text DEFAULT '',
  "school_name" text NOT NULL,
  "school_district" text DEFAULT '',
  "school_province" text DEFAULT '',
  "grade_level" text NOT NULL,
  "is_maintenance_fee" boolean DEFAULT true NOT NULL,
  "is_tuition_fee" boolean DEFAULT false NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "receipt_number" text DEFAULT '',
  "receipt_date" text DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL
);
`.trim();

function formatSqlLiteral(val: unknown): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'boolean') {
    return val ? 'TRUE' : 'FALSE';
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : 'NULL';
  }
  if (val instanceof Date) {
    return `'${val.toISOString()}'`;
  }
  const str = String(val);
  if (str.includes('\\') || str.includes('\n') || str.includes('\r')) {
    const escaped = str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "''")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');
    return `E'${escaped}'`;
  }
  return `'${str.replace(/'/g, "''")}'`;
}

export function buildPostgresSqlDump(
  backup: DatabaseBackupPayload,
  fiscalYear?: string
): string {
  const scopeLabel =
    fiscalYear && fiscalYear !== 'all'
      ? `ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`
      : 'ข้อมูลทั้งหมดทุกปีงบประมาณ';

  const lines: string[] = [
    '-- ============================================================================',
    '-- ระบบใบเบิกเงินสวัสดิการ สำนักงานสาธารณสุขอำเภอดอนพุด',
    '-- PostgreSQL Annual Database Backup Dump (แบบ 7131 และ แบบ 7223)',
    `-- ขอบเขตข้อมูล: ${scopeLabel}`,
    `-- ส่งออกเมื่อ: ${new Date().toISOString()}`,
    '-- ============================================================================',
    '',
    'BEGIN;',
    '',
    '-- 1. โครงสร้างตารางฐานข้อมูล (Schema DDL)',
    SCHEMA_DDL,
    '',
    '-- 2. ข้อมูลในตาราง (เรียงตามลำดับ Foreign Key)',
  ];

  for (const tableName of TABLE_ORDER) {
    const rows = backup[tableName] || [];
    const cols = TABLE_COLUMNS[tableName];
    lines.push('');
    lines.push(`-- Table: ${tableName} (${rows.length} rows)`);

    if (rows.length === 0) {
      continue;
    }

    const colSql = cols.map((c) => `"${c.sqlCol}"`).join(', ');
    for (const row of rows) {
      const valsSql = cols.map((c) => formatSqlLiteral(row[c.jsKey])).join(', ');
      lines.push(
        `INSERT INTO "${tableName}" (${colSql}) VALUES (${valsSql}) ON CONFLICT ("id") DO NOTHING;`
      );
    }
  }

  lines.push('');
  lines.push('-- 3. ปรับค่า Sequence ของ Primary Key ให้ตรงกับข้อมูลล่าสุด');
  for (const tableName of TABLE_ORDER) {
    lines.push(
      `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE((SELECT MAX("id") FROM "${tableName}"), 1), (SELECT COUNT(*) > 0 FROM "${tableName}"));`
    );
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  return lines.join('\n');
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const raw = val instanceof Date ? val.toISOString() : String(val);
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n') || raw.includes('\r')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function isValidBackupTable(table: string): table is BackupTableName {
  return TABLE_ORDER.includes(table as BackupTableName);
}

export function buildBackupCsv(
  backup: DatabaseBackupPayload,
  table: BackupTableName | 'all' = 'all'
): string {
  if (table !== 'all') {
    const cols = TABLE_COLUMNS[table];
    const rows = backup[table] || [];
    const headerLine = cols.map((c) => escapeCsvCell(c.sqlCol)).join(',');
    const dataLines = rows.map((row) =>
      cols.map((c) => escapeCsvCell(row[c.jsKey])).join(',')
    );
    return '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  }

  const sections: string[] = [];
  for (const tableName of TABLE_ORDER) {
    const cols = TABLE_COLUMNS[tableName];
    const rows = backup[tableName] || [];
    sections.push(`### TABLE: ${tableName} (${rows.length} rows)`);
    sections.push(cols.map((c) => escapeCsvCell(c.sqlCol)).join(','));
    for (const row of rows) {
      sections.push(cols.map((c) => escapeCsvCell(row[c.jsKey])).join(','));
    }
    sections.push('');
  }

  return '\uFEFF' + sections.join('\r\n');
}
