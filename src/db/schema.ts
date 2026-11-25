import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Authenticated application users linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').default(''),
  role: text('role').notNull().default('staff'),
  googleSpreadsheetId: text('google_spreadsheet_id').default(''),
  googleSpreadsheetTitle: text('google_spreadsheet_title').default(''),
  googleSpreadsheetUrl: text('google_spreadsheet_url').default(''),
  lastSheetSyncAt: text('last_sheet_sync_at').default(''),
  lastSheetSyncStatus: text('last_sheet_sync_status').default('idle'),
  lastSheetSyncError: text('last_sheet_sync_error').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Public health personnel directory (ข้อมูลเจ้าหน้าที่สาธารณสุข สำนักงานสาธารณสุขอำเภอดอนพุด)
export const staffProfiles = pgTable('staff_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  staffCode: text('staff_code').notNull(),
  prefix: text('prefix').notNull().default(''),
  fullName: text('full_name').notNull(),
  nationalId: text('national_id').notNull(),
  position: text('position').notNull(),
  affiliation: text('affiliation').notNull().default('สำนักงานสาธารณสุขอำเภอดอนพุด'),
  department: text('department').notNull().default(''),
  phone: text('phone').default(''),
  bankName: text('bank_name').default(''),
  bankAccount: text('bank_account').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Eligible family dependents for staff (คู่สมรส, บิดา, มารดา, บุตร)
export const staffDependents = pgTable('staff_dependents', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id')
    .references(() => staffProfiles.id, { onDelete: 'cascade' })
    .notNull(),
  relationship: text('relationship').notNull(), // 'spouse' | 'father' | 'mother' | 'child'
  fullName: text('full_name').notNull(),
  nationalId: text('national_id').notNull(),
  birthDate: text('birth_date').default(''),
  childOrder: integer('child_order'),
  isMinor: boolean('is_minor').default(false),
  isIncapacitated: boolean('is_incapacitated').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Form 7131 Medical Welfare Reimbursement Claims (ใบเบิกเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล แบบ 7131)
export const medicalClaims = pgTable('medical_claims', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  staffId: integer('staff_id')
    .references(() => staffProfiles.id, { onDelete: 'restrict' })
    .notNull(),
  claimNumber: text('claim_number').notNull(),
  fiscalYear: text('fiscal_year').notNull(),
  claimDate: text('claim_date').notNull(), // YYYY-MM-DD

  // Section 1: Claimant info snapshot
  claimantName: text('claimant_name').notNull(),
  claimantPosition: text('claimant_position').notNull(),
  claimantAffiliation: text('claimant_affiliation').notNull(),

  // Section 2: Patient & Treatment info
  patientType: text('patient_type').notNull(), // 'self' | 'spouse' | 'father' | 'mother' | 'child'
  patientName: text('patient_name').default(''),
  patientNationalId: text('patient_national_id').default(''),
  childBirthDate: text('child_birth_date').default(''),
  childOrder: integer('child_order'),
  isMinor: boolean('is_minor').default(false),
  isIncapacitated: boolean('is_incapacitated').default(false),

  diagnosis: text('diagnosis').notNull(),
  hospitalName: text('hospital_name').notNull(),
  hospitalType: text('hospital_type').notNull(), // 'public' | 'private'
  treatmentStartDate: text('treatment_start_date').notNull(), // YYYY-MM-DD
  treatmentEndDate: text('treatment_end_date').notNull(), // YYYY-MM-DD

  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  totalAmountText: text('total_amount_text').notNull(),
  receiptCount: integer('receipt_count').notNull().default(1),

  // Section 3: Entitlement & Rights Declaration
  entitlementBasis: text('entitlement_basis').notNull(), // 'full' | 'excess_other_agency' | 'excess_insurance'
  claimableAmount: numeric('claimable_amount', { precision: 12, scale: 2 }).notNull(),
  claimableAmountText: text('claimable_amount_text').notNull(),
  selfRightsOption: text('self_rights_option').notNull(),
  relatedPersonRole: text('related_person_role').default(''),
  relatedRightsOption: text('related_rights_option').default(''),

  // Approval & Workflow
  status: text('status').notNull().default('submitted'),
  approverName: text('approver_name').default(''),
  approverPosition: text('approver_position').default(''),
  approvedDate: text('approved_date').default(''),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Itemized medical expenses / receipts attached to a Form 7131 claim
export const claimReceipts = pgTable('claim_receipts', {
  id: serial('id').primaryKey(),
  claimId: integer('claim_id')
    .references(() => medicalClaims.id, { onDelete: 'cascade' })
    .notNull(),
  receiptNumber: text('receipt_number').notNull(),
  receiptDate: text('receipt_date').notNull(), // YYYY-MM-DD
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Form 7223 Child Education Welfare Reimbursement Claims (ใบเบิกเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร แบบ 7223)
export const educationClaims = pgTable('education_claims', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  staffId: integer('staff_id')
    .references(() => staffProfiles.id, { onDelete: 'restrict' })
    .notNull(),
  claimNumber: text('claim_number').notNull(),
  fiscalYear: text('fiscal_year').notNull(),
  academicYear: text('academic_year').notNull().default('2569'),
  semester: text('semester').notNull().default('1'),
  claimDate: text('claim_date').notNull(), // YYYY-MM-DD

  // Section 1: Claimant info snapshot
  claimantName: text('claimant_name').notNull(),
  claimantPosition: text('claimant_position').notNull(),
  claimantAffiliation: text('claimant_affiliation').notNull(),

  // Section 2: Spouse details
  spouseName: text('spouse_name').default(''),
  spouseStatus: text('spouse_status').notNull().default('not_gov'), // 'not_gov' | 'gov_officer' | 'permanent_employee' | 'state_enterprise_or_other'
  spousePosition: text('spouse_position').default(''),
  spouseAffiliation: text('spouse_affiliation').default(''),

  // Section 3: Claimant legal role
  claimantRole: text('claimant_role').notNull().default('lawful_father'), // 'lawful_father' | 'mother'

  // Section 5: Totals & Entitlement basis
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  totalAmountText: text('total_amount_text').notNull(),
  entitlementBasis: text('entitlement_basis').notNull().default('full'), // 'full' | 'partial'
  claimableAmount: numeric('claimable_amount', { precision: 12, scale: 2 }).notNull(),
  claimableAmountText: text('claimable_amount_text').notNull(),

  // Section 6: Declarations
  certHasRight: boolean('cert_has_right').default(true).notNull(),
  certChildEligible: boolean('cert_child_eligible').default(true).notNull(),
  certSoleClaimant: boolean('cert_sole_claimant').default(false).notNull(),
  certSpouseLowerBenefit: boolean('cert_spouse_lower_benefit').default(false).notNull(),
  spouseLowerAmount: numeric('spouse_lower_amount', { precision: 12, scale: 2 }).default('0.00'),

  // Section 7 & Workflow
  status: text('status').notNull().default('submitted'), // 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected'
  approverName: text('approver_name').default(''),
  approverPosition: text('approver_position').default(''),
  approvedDate: text('approved_date').default(''),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Children & Education Expenses attached to Form 7223 claim
export const educationClaimChildren = pgTable('education_claim_children', {
  id: serial('id').primaryKey(),
  educationClaimId: integer('education_claim_id')
    .references(() => educationClaims.id, { onDelete: 'cascade' })
    .notNull(),
  dependentId: integer('dependent_id').references(() => staffDependents.id, {
    onDelete: 'set null',
  }),
  childOrderIndex: integer('child_order_index').notNull().default(1),
  childName: text('child_name').notNull(),
  childBirthDate: text('child_birth_date').default(''),
  fatherChildOrder: integer('father_child_order'),
  motherChildOrder: integer('mother_child_order'),
  replacingDeceasedOrder: integer('replacing_deceased_order'),
  deceasedChildName: text('deceased_child_name').default(''),
  deceasedChildBirthDate: text('deceased_child_birth_date').default(''),
  deceasedChildDeathDate: text('deceased_child_death_date').default(''),
  schoolName: text('school_name').notNull(),
  schoolDistrict: text('school_district').default(''),
  schoolProvince: text('school_province').default(''),
  gradeLevel: text('grade_level').notNull(),
  isMaintenanceFee: boolean('is_maintenance_fee').default(true).notNull(), // (1) เงินบำรุงการศึกษา
  isTuitionFee: boolean('is_tuition_fee').default(false).notNull(), // (2) เงินค่าเล่าเรียน
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  receiptNumber: text('receipt_number').default(''),
  receiptDate: text('receipt_date').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  staffProfiles: many(staffProfiles),
  medicalClaims: many(medicalClaims),
  educationClaims: many(educationClaims),
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one, many }) => ({
  owner: one(users, {
    fields: [staffProfiles.userId],
    references: [users.id],
  }),
  dependents: many(staffDependents),
  claims: many(medicalClaims),
  educationClaims: many(educationClaims),
}));

export const staffDependentsRelations = relations(staffDependents, ({ one, many }) => ({
  staff: one(staffProfiles, {
    fields: [staffDependents.staffId],
    references: [staffProfiles.id],
  }),
  educationClaimChildren: many(educationClaimChildren),
}));

export const medicalClaimsRelations = relations(medicalClaims, ({ one, many }) => ({
  owner: one(users, {
    fields: [medicalClaims.userId],
    references: [users.id],
  }),
  staff: one(staffProfiles, {
    fields: [medicalClaims.staffId],
    references: [staffProfiles.id],
  }),
  receipts: many(claimReceipts),
}));

export const claimReceiptsRelations = relations(claimReceipts, ({ one }) => ({
  claim: one(medicalClaims, {
    fields: [claimReceipts.claimId],
    references: [medicalClaims.id],
  }),
}));

export const educationClaimsRelations = relations(educationClaims, ({ one, many }) => ({
  owner: one(users, {
    fields: [educationClaims.userId],
    references: [users.id],
  }),
  staff: one(staffProfiles, {
    fields: [educationClaims.staffId],
    references: [staffProfiles.id],
  }),
  children: many(educationClaimChildren),
}));

export const educationClaimChildrenRelations = relations(
  educationClaimChildren,
  ({ one }) => ({
    educationClaim: one(educationClaims, {
      fields: [educationClaimChildren.educationClaimId],
      references: [educationClaims.id],
    }),
    dependent: one(staffDependents, {
      fields: [educationClaimChildren.dependentId],
      references: [staffDependents.id],
    }),
  })
);
