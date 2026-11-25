import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  claimReceipts,
  educationClaimChildren,
  educationClaims,
  medicalClaims,
  staffDependents,
  staffProfiles,
  users,
} from './schema.ts';
import { bahtText, getThaiFiscalYear } from '../lib/thai-utils.ts';

export interface StaffInput {
  staffCode: string;
  prefix: string;
  fullName: string;
  nationalId: string;
  position: string;
  affiliation: string;
  department: string;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
}

export interface DependentInput {
  relationship: string;
  fullName: string;
  nationalId: string;
  birthDate?: string;
  childOrder?: number | null;
  isMinor?: boolean;
  isIncapacitated?: boolean;
}

export interface ReceiptInput {
  receiptNumber: string;
  receiptDate: string;
  category: string;
  description: string;
  amount: number;
}

export interface ClaimInput {
  staffId: number;
  claimNumber?: string;
  fiscalYear?: string;
  claimDate: string;
  claimantName: string;
  claimantPosition: string;
  claimantAffiliation: string;
  patientType: string;
  patientName?: string;
  patientNationalId?: string;
  childBirthDate?: string;
  childOrder?: number | null;
  isMinor?: boolean;
  isIncapacitated?: boolean;
  diagnosis: string;
  hospitalName: string;
  hospitalType: string;
  treatmentStartDate: string;
  treatmentEndDate: string;
  entitlementBasis: string;
  claimableAmount: number;
  selfRightsOption: string;
  relatedPersonRole?: string;
  relatedRightsOption?: string;
  status?: string;
  approverName?: string;
  approverPosition?: string;
  approvedDate?: string;
  notes?: string;
  receipts: ReceiptInput[];
}

export interface EducationChildInput {
  dependentId?: number | null;
  childOrderIndex?: number;
  childName: string;
  childBirthDate?: string;
  fatherChildOrder?: number | null;
  motherChildOrder?: number | null;
  replacingDeceasedOrder?: number | null;
  deceasedChildName?: string;
  deceasedChildBirthDate?: string;
  deceasedChildDeathDate?: string;
  schoolName: string;
  schoolDistrict?: string;
  schoolProvince?: string;
  gradeLevel: string;
  isMaintenanceFee: boolean;
  isTuitionFee: boolean;
  amount: number;
  receiptNumber?: string;
  receiptDate?: string;
}

export interface EducationClaimInput {
  staffId: number;
  claimNumber?: string;
  fiscalYear?: string;
  academicYear: string;
  semester: string;
  claimDate: string;
  claimantName: string;
  claimantPosition: string;
  claimantAffiliation: string;
  spouseName?: string;
  spouseStatus: string;
  spousePosition?: string;
  spouseAffiliation?: string;
  claimantRole: string;
  entitlementBasis: string;
  claimableAmount: number;
  certHasRight?: boolean;
  certChildEligible?: boolean;
  certSoleClaimant?: boolean;
  certSpouseLowerBenefit?: boolean;
  spouseLowerAmount?: number;
  status?: string;
  approverName?: string;
  approverPosition?: string;
  approvedDate?: string;
  notes?: string;
  children: EducationChildInput[];
}

export async function listStaffWithDependents(userId: number) {
  try {
    const staffList = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId))
      .orderBy(desc(staffProfiles.createdAt));

    if (staffList.length === 0) return [];

    const allDependents = await db
      .select()
      .from(staffDependents)
      .where(
        sql`${staffDependents.staffId} IN (${sql.join(
          staffList.map((s) => sql`${s.id}`),
          sql`, `
        )})`
      );

    const claimCounts = await db
      .select({
        staffId: medicalClaims.staffId,
        count: sql<number>`count(*)::int`,
        totalClaimed: sql<string>`coalesce(sum(${medicalClaims.claimableAmount}), 0)::text`,
      })
      .from(medicalClaims)
      .where(eq(medicalClaims.userId, userId))
      .groupBy(medicalClaims.staffId);

    const eduCounts = await db
      .select({
        staffId: educationClaims.staffId,
        count: sql<number>`count(*)::int`,
        totalClaimed: sql<string>`coalesce(sum(${educationClaims.claimableAmount}), 0)::text`,
      })
      .from(educationClaims)
      .where(eq(educationClaims.userId, userId))
      .groupBy(educationClaims.staffId);

    return staffList.map((staff) => {
      const deps = allDependents.filter((d) => d.staffId === staff.id);
      const medStats = claimCounts.find((c) => c.staffId === staff.id);
      const eduStats = eduCounts.find((c) => c.staffId === staff.id);
      return {
        ...staff,
        dependents: deps,
        claimCount: medStats?.count ?? 0,
        totalClaimed: medStats?.totalClaimed ?? '0.00',
        educationClaimCount: eduStats?.count ?? 0,
        totalEducationClaimed: eduStats?.totalClaimed ?? '0.00',
      };
    });
  } catch (error) {
    console.error('Database query failed in listStaffWithDependents:', error);
    throw new Error('ไม่สามารถโหลดทะเบียนเจ้าหน้าที่สาธารณสุขได้', { cause: error });
  }
}

export async function createStaffProfile(userId: number, input: StaffInput) {
  try {
    const [created] = await db
      .insert(staffProfiles)
      .values({
        userId,
        staffCode: input.staffCode.trim(),
        prefix: input.prefix.trim(),
        fullName: input.fullName.trim(),
        nationalId: input.nationalId.trim(),
        position: input.position.trim(),
        affiliation: input.affiliation.trim() || 'สำนักงานสาธารณสุขอำเภอดอนพุด',
        department: input.department.trim(),
        phone: input.phone?.trim() || '',
        bankName: input.bankName?.trim() || '',
        bankAccount: input.bankAccount?.trim() || '',
      })
      .returning();

    return {
      ...created,
      dependents: [],
      claimCount: 0,
      totalClaimed: '0.00',
      educationClaimCount: 0,
      totalEducationClaimed: '0.00',
    };
  } catch (error) {
    console.error('Database query failed in createStaffProfile:', error);
    throw new Error('ไม่สามารถบันทึกข้อมูลเจ้าหน้าที่สาธารณสุขได้', { cause: error });
  }
}

export async function updateStaffProfile(
  userId: number,
  staffId: number,
  input: StaffInput
) {
  try {
    const [updated] = await db
      .update(staffProfiles)
      .set({
        staffCode: input.staffCode.trim(),
        prefix: input.prefix.trim(),
        fullName: input.fullName.trim(),
        nationalId: input.nationalId.trim(),
        position: input.position.trim(),
        affiliation: input.affiliation.trim(),
        department: input.department.trim(),
        phone: input.phone?.trim() || '',
        bankName: input.bankName?.trim() || '',
        bankAccount: input.bankAccount?.trim() || '',
        updatedAt: new Date(),
      })
      .where(and(eq(staffProfiles.id, staffId), eq(staffProfiles.userId, userId)))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('Database query failed in updateStaffProfile:', error);
    throw new Error('ไม่สามารถแก้ไขข้อมูลเจ้าหน้าที่สาธารณสุขได้', { cause: error });
  }
}

export async function deleteStaffProfile(userId: number, staffId: number) {
  try {
    const linkedMed = await db
      .select({ id: medicalClaims.id })
      .from(medicalClaims)
      .where(and(eq(medicalClaims.staffId, staffId), eq(medicalClaims.userId, userId)));

    const linkedEdu = await db
      .select({ id: educationClaims.id })
      .from(educationClaims)
      .where(and(eq(educationClaims.staffId, staffId), eq(educationClaims.userId, userId)));

    if (linkedMed.length > 0 || linkedEdu.length > 0) {
      throw new Error('CONFLICT_CLAIMS_EXIST');
    }

    const [deleted] = await db
      .delete(staffProfiles)
      .where(and(eq(staffProfiles.id, staffId), eq(staffProfiles.userId, userId)))
      .returning();

    return deleted || null;
  } catch (error: any) {
    if (error?.message === 'CONFLICT_CLAIMS_EXIST') {
      throw error;
    }
    console.error('Database query failed in deleteStaffProfile:', error);
    throw new Error('ไม่สามารถลบข้อมูลเจ้าหน้าที่สาธารณสุขได้', { cause: error });
  }
}

export async function addStaffDependent(
  userId: number,
  staffId: number,
  input: DependentInput
) {
  try {
    const [staff] = await db
      .select()
      .from(staffProfiles)
      .where(and(eq(staffProfiles.id, staffId), eq(staffProfiles.userId, userId)));

    if (!staff) return null;

    const [created] = await db
      .insert(staffDependents)
      .values({
        staffId,
        relationship: input.relationship,
        fullName: input.fullName.trim(),
        nationalId: input.nationalId.trim(),
        birthDate: input.birthDate?.trim() || '',
        childOrder: input.childOrder ?? null,
        isMinor: Boolean(input.isMinor),
        isIncapacitated: Boolean(input.isIncapacitated),
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Database query failed in addStaffDependent:', error);
    throw new Error('ไม่สามารถเพิ่มข้อมูลบุคคลในครอบครัวได้', { cause: error });
  }
}

export async function deleteStaffDependent(userId: number, dependentId: number) {
  try {
    const rows = await db
      .select({
        depId: staffDependents.id,
        staffUserId: staffProfiles.userId,
      })
      .from(staffDependents)
      .innerJoin(staffProfiles, eq(staffDependents.staffId, staffProfiles.id))
      .where(eq(staffDependents.id, dependentId));

    if (rows.length === 0 || rows[0].staffUserId !== userId) {
      return null;
    }

    const [deleted] = await db
      .delete(staffDependents)
      .where(eq(staffDependents.id, dependentId))
      .returning();

    return deleted || null;
  } catch (error) {
    console.error('Database query failed in deleteStaffDependent:', error);
    throw new Error('ไม่สามารถลบข้อมูลบุคคลในครอบครัวได้', { cause: error });
  }
}

// =========================================================================
// FORM 7131: Medical Welfare Reimbursement Claims
// =========================================================================

export async function listMedicalClaims(
  userId: number,
  filters: {
    status?: string;
    fiscalYear?: string;
    search?: string;
    hospitalType?: string;
  }
) {
  try {
    const conditions = [eq(medicalClaims.userId, userId)];

    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(medicalClaims.status, filters.status));
    }
    if (filters.fiscalYear && filters.fiscalYear !== 'all') {
      conditions.push(eq(medicalClaims.fiscalYear, filters.fiscalYear));
    }
    if (filters.hospitalType && filters.hospitalType !== 'all') {
      conditions.push(eq(medicalClaims.hospitalType, filters.hospitalType));
    }
    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(medicalClaims.claimNumber, q),
          ilike(medicalClaims.claimantName, q),
          ilike(medicalClaims.patientName, q),
          ilike(medicalClaims.diagnosis, q),
          ilike(medicalClaims.hospitalName, q)
        )!
      );
    }

    const claims = await db
      .select()
      .from(medicalClaims)
      .where(and(...conditions))
      .orderBy(desc(medicalClaims.claimDate), desc(medicalClaims.id));

    if (claims.length === 0) return [];

    const receipts = await db
      .select()
      .from(claimReceipts)
      .where(
        sql`${claimReceipts.claimId} IN (${sql.join(
          claims.map((c) => sql`${c.id}`),
          sql`, `
        )})`
      );

    return claims.map((claim) => ({
      ...claim,
      receipts: receipts.filter((r) => r.claimId === claim.id),
    }));
  } catch (error) {
    console.error('Database query failed in listMedicalClaims:', error);
    throw new Error('ไม่สามารถโหลดรายการใบเบิกค่ารักษาพยาบาลได้', { cause: error });
  }
}

export async function getMedicalClaimById(userId: number, claimId: number) {
  try {
    const [claim] = await db
      .select()
      .from(medicalClaims)
      .where(and(eq(medicalClaims.id, claimId), eq(medicalClaims.userId, userId)));

    if (!claim) return null;

    const [staff] = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.id, claim.staffId));

    const receipts = await db
      .select()
      .from(claimReceipts)
      .where(eq(claimReceipts.claimId, claim.id));

    return {
      ...claim,
      staff: staff || null,
      receipts,
    };
  } catch (error) {
    console.error('Database query failed in getMedicalClaimById:', error);
    throw new Error('ไม่สามารถโหลดรายละเอียดใบเบิกแบบ 7131 ได้', { cause: error });
  }
}

async function generateClaimNumber(userId: number, fiscalYear: string): Promise<string> {
  const existing = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(medicalClaims)
    .where(and(eq(medicalClaims.userId, userId), eq(medicalClaims.fiscalYear, fiscalYear)));

  const nextSeq = (existing[0]?.count ?? 0) + 1;
  return `7131-${fiscalYear}-${String(nextSeq).padStart(4, '0')}`;
}

export async function createMedicalClaim(userId: number, input: ClaimInput) {
  try {
    const [staff] = await db
      .select()
      .from(staffProfiles)
      .where(and(eq(staffProfiles.id, input.staffId), eq(staffProfiles.userId, userId)));

    if (!staff) {
      throw new Error('STAFF_NOT_FOUND');
    }

    const fiscalYear = input.fiscalYear?.trim() || getThaiFiscalYear(input.claimDate);
    const claimNumber =
      input.claimNumber?.trim() || (await generateClaimNumber(userId, fiscalYear));

    const validReceipts = (input.receipts || []).filter((r) => Number(r.amount) > 0);
    const totalAmountNum = validReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
    const claimableNum =
      input.claimableAmount > 0 ? Number(input.claimableAmount) : totalAmountNum;

    return await db.transaction(async (tx) => {
      const [insertedClaim] = await tx
        .insert(medicalClaims)
        .values({
          userId,
          staffId: input.staffId,
          claimNumber,
          fiscalYear,
          claimDate: input.claimDate,
          claimantName: input.claimantName.trim(),
          claimantPosition: input.claimantPosition.trim(),
          claimantAffiliation: input.claimantAffiliation.trim(),
          patientType: input.patientType,
          patientName: input.patientName?.trim() || '',
          patientNationalId: input.patientNationalId?.trim() || '',
          childBirthDate: input.childBirthDate?.trim() || '',
          childOrder: input.childOrder ?? null,
          isMinor: Boolean(input.isMinor),
          isIncapacitated: Boolean(input.isIncapacitated),
          diagnosis: input.diagnosis.trim(),
          hospitalName: input.hospitalName.trim(),
          hospitalType: input.hospitalType,
          treatmentStartDate: input.treatmentStartDate,
          treatmentEndDate: input.treatmentEndDate,
          totalAmount: totalAmountNum.toFixed(2),
          totalAmountText: bahtText(totalAmountNum),
          receiptCount: validReceipts.length || 1,
          entitlementBasis: input.entitlementBasis,
          claimableAmount: claimableNum.toFixed(2),
          claimableAmountText: bahtText(claimableNum),
          selfRightsOption: input.selfRightsOption,
          relatedPersonRole: input.relatedPersonRole?.trim() || '',
          relatedRightsOption: input.relatedRightsOption?.trim() || '',
          status: input.status || 'submitted',
          approverName: input.approverName?.trim() || '',
          approverPosition: input.approverPosition?.trim() || '',
          approvedDate: input.approvedDate?.trim() || '',
          notes: input.notes?.trim() || '',
        })
        .returning();

      let insertedReceipts: (typeof claimReceipts.$inferSelect)[] = [];
      if (validReceipts.length > 0) {
        insertedReceipts = await tx
          .insert(claimReceipts)
          .values(
            validReceipts.map((r) => ({
              claimId: insertedClaim.id,
              receiptNumber: r.receiptNumber.trim(),
              receiptDate: r.receiptDate,
              category: r.category.trim(),
              description: r.description.trim(),
              amount: Number(r.amount).toFixed(2),
            }))
          )
          .returning();
      }

      return {
        ...insertedClaim,
        receipts: insertedReceipts,
      };
    });
  } catch (error: any) {
    if (error?.message === 'STAFF_NOT_FOUND') throw error;
    console.error('Database query failed in createMedicalClaim:', error);
    throw new Error('ไม่สามารถบันทึกใบเบิกเงินสวัสดิการ แบบ 7131 ได้', { cause: error });
  }
}

export async function updateMedicalClaim(
  userId: number,
  claimId: number,
  input: ClaimInput
) {
  try {
    const [existing] = await db
      .select()
      .from(medicalClaims)
      .where(and(eq(medicalClaims.id, claimId), eq(medicalClaims.userId, userId)));

    if (!existing) return null;

    const fiscalYear = input.fiscalYear?.trim() || getThaiFiscalYear(input.claimDate);
    const validReceipts = (input.receipts || []).filter((r) => Number(r.amount) > 0);
    const totalAmountNum = validReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
    const claimableNum =
      input.claimableAmount > 0 ? Number(input.claimableAmount) : totalAmountNum;

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(medicalClaims)
        .set({
          staffId: input.staffId,
          claimNumber: input.claimNumber?.trim() || existing.claimNumber,
          fiscalYear,
          claimDate: input.claimDate,
          claimantName: input.claimantName.trim(),
          claimantPosition: input.claimantPosition.trim(),
          claimantAffiliation: input.claimantAffiliation.trim(),
          patientType: input.patientType,
          patientName: input.patientName?.trim() || '',
          patientNationalId: input.patientNationalId?.trim() || '',
          childBirthDate: input.childBirthDate?.trim() || '',
          childOrder: input.childOrder ?? null,
          isMinor: Boolean(input.isMinor),
          isIncapacitated: Boolean(input.isIncapacitated),
          diagnosis: input.diagnosis.trim(),
          hospitalName: input.hospitalName.trim(),
          hospitalType: input.hospitalType,
          treatmentStartDate: input.treatmentStartDate,
          treatmentEndDate: input.treatmentEndDate,
          totalAmount: totalAmountNum.toFixed(2),
          totalAmountText: bahtText(totalAmountNum),
          receiptCount: validReceipts.length || 1,
          entitlementBasis: input.entitlementBasis,
          claimableAmount: claimableNum.toFixed(2),
          claimableAmountText: bahtText(claimableNum),
          selfRightsOption: input.selfRightsOption,
          relatedPersonRole: input.relatedPersonRole?.trim() || '',
          relatedRightsOption: input.relatedRightsOption?.trim() || '',
          status: input.status || existing.status,
          approverName: input.approverName?.trim() ?? existing.approverName,
          approverPosition: input.approverPosition?.trim() ?? existing.approverPosition,
          approvedDate: input.approvedDate?.trim() ?? existing.approvedDate,
          notes: input.notes?.trim() ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(and(eq(medicalClaims.id, claimId), eq(medicalClaims.userId, userId)))
        .returning();

      await tx.delete(claimReceipts).where(eq(claimReceipts.claimId, claimId));

      let insertedReceipts: (typeof claimReceipts.$inferSelect)[] = [];
      if (validReceipts.length > 0) {
        insertedReceipts = await tx
          .insert(claimReceipts)
          .values(
            validReceipts.map((r) => ({
              claimId,
              receiptNumber: r.receiptNumber.trim(),
              receiptDate: r.receiptDate,
              category: r.category.trim(),
              description: r.description.trim(),
              amount: Number(r.amount).toFixed(2),
            }))
          )
          .returning();
      }

      return {
        ...updated,
        receipts: insertedReceipts,
      };
    });
  } catch (error) {
    console.error('Database query failed in updateMedicalClaim:', error);
    throw new Error('ไม่สามารถแก้ไขใบเบิกเงินสวัสดิการ แบบ 7131 ได้', { cause: error });
  }
}

export async function updateMedicalClaimStatus(
  userId: number,
  claimId: number,
  payload: {
    status: string;
    approverName?: string;
    approverPosition?: string;
    approvedDate?: string;
    notes?: string;
  }
) {
  try {
    const [updated] = await db
      .update(medicalClaims)
      .set({
        status: payload.status,
        approverName: payload.approverName?.trim() || '',
        approverPosition: payload.approverPosition?.trim() || '',
        approvedDate: payload.approvedDate?.trim() || '',
        notes: payload.notes?.trim() || '',
        updatedAt: new Date(),
      })
      .where(and(eq(medicalClaims.id, claimId), eq(medicalClaims.userId, userId)))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('Database query failed in updateMedicalClaimStatus:', error);
    throw new Error('ไม่สามารถอัปเดตสถานะการอนุมัติได้', { cause: error });
  }
}

export async function deleteMedicalClaim(userId: number, claimId: number) {
  try {
    const [deleted] = await db
      .delete(medicalClaims)
      .where(and(eq(medicalClaims.id, claimId), eq(medicalClaims.userId, userId)))
      .returning();

    return deleted || null;
  } catch (error) {
    console.error('Database query failed in deleteMedicalClaim:', error);
    throw new Error('ไม่สามารถลบใบเบิกค่ารักษาพยาบาลได้', { cause: error });
  }
}

// =========================================================================
// FORM 7223: Child Education Welfare Reimbursement Claims
// =========================================================================

export async function listEducationClaims(
  userId: number,
  filters: {
    status?: string;
    fiscalYear?: string;
    search?: string;
  }
) {
  try {
    const conditions = [eq(educationClaims.userId, userId)];

    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(educationClaims.status, filters.status));
    }
    if (filters.fiscalYear && filters.fiscalYear !== 'all') {
      conditions.push(eq(educationClaims.fiscalYear, filters.fiscalYear));
    }
    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(educationClaims.claimNumber, q),
          ilike(educationClaims.claimantName, q),
          ilike(educationClaims.spouseName, q)
        )!
      );
    }

    const claims = await db
      .select()
      .from(educationClaims)
      .where(and(...conditions))
      .orderBy(desc(educationClaims.claimDate), desc(educationClaims.id));

    if (claims.length === 0) return [];

    const childrenRows = await db
      .select()
      .from(educationClaimChildren)
      .where(
        sql`${educationClaimChildren.educationClaimId} IN (${sql.join(
          claims.map((c) => sql`${c.id}`),
          sql`, `
        )})`
      )
      .orderBy(asc(educationClaimChildren.childOrderIndex));

    return claims.map((claim) => ({
      ...claim,
      children: childrenRows.filter((ch) => ch.educationClaimId === claim.id),
    }));
  } catch (error) {
    console.error('Database query failed in listEducationClaims:', error);
    throw new Error('ไม่สามารถโหลดรายการใบเบิกค่าการศึกษาของบุตร แบบ 7223 ได้', {
      cause: error,
    });
  }
}

export async function getEducationClaimById(userId: number, claimId: number) {
  try {
    const [claim] = await db
      .select()
      .from(educationClaims)
      .where(and(eq(educationClaims.id, claimId), eq(educationClaims.userId, userId)));

    if (!claim) return null;

    const [staff] = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.id, claim.staffId));

    const children = await db
      .select()
      .from(educationClaimChildren)
      .where(eq(educationClaimChildren.educationClaimId, claim.id))
      .orderBy(asc(educationClaimChildren.childOrderIndex));

    return {
      ...claim,
      staff: staff || null,
      children,
    };
  } catch (error) {
    console.error('Database query failed in getEducationClaimById:', error);
    throw new Error('ไม่สามารถโหลดรายละเอียดใบเบิกแบบ 7223 ได้', { cause: error });
  }
}

async function generateEducationClaimNumber(
  userId: number,
  fiscalYear: string
): Promise<string> {
  const existing = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(educationClaims)
    .where(
      and(eq(educationClaims.userId, userId), eq(educationClaims.fiscalYear, fiscalYear))
    );

  const nextSeq = (existing[0]?.count ?? 0) + 1;
  return `7223-${fiscalYear}-${String(nextSeq).padStart(4, '0')}`;
}

export async function createEducationClaim(
  userId: number,
  input: EducationClaimInput
) {
  try {
    const [staff] = await db
      .select()
      .from(staffProfiles)
      .where(and(eq(staffProfiles.id, input.staffId), eq(staffProfiles.userId, userId)));

    if (!staff) {
      throw new Error('STAFF_NOT_FOUND');
    }

    const fiscalYear = input.fiscalYear?.trim() || getThaiFiscalYear(input.claimDate);
    const claimNumber =
      input.claimNumber?.trim() ||
      (await generateEducationClaimNumber(userId, fiscalYear));

    const validChildren = (input.children || []).filter(
      (c) => c.childName.trim() && Number(c.amount) > 0
    );
    const totalAmountNum = validChildren.reduce((s, c) => s + Number(c.amount), 0);
    const claimableNum =
      input.entitlementBasis === 'partial' && input.claimableAmount > 0
        ? Number(input.claimableAmount)
        : totalAmountNum;

    return await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(educationClaims)
        .values({
          userId,
          staffId: input.staffId,
          claimNumber,
          fiscalYear,
          academicYear: input.academicYear?.trim() || fiscalYear,
          semester: input.semester?.trim() || '1',
          claimDate: input.claimDate,
          claimantName: input.claimantName.trim(),
          claimantPosition: input.claimantPosition.trim(),
          claimantAffiliation: input.claimantAffiliation.trim(),
          spouseName: input.spouseName?.trim() || '',
          spouseStatus: input.spouseStatus || 'not_gov',
          spousePosition: input.spousePosition?.trim() || '',
          spouseAffiliation: input.spouseAffiliation?.trim() || '',
          claimantRole: input.claimantRole || 'lawful_father',
          totalAmount: totalAmountNum.toFixed(2),
          totalAmountText: bahtText(totalAmountNum),
          entitlementBasis: input.entitlementBasis || 'full',
          claimableAmount: claimableNum.toFixed(2),
          claimableAmountText: bahtText(claimableNum),
          certHasRight: input.certHasRight ?? true,
          certChildEligible: input.certChildEligible ?? true,
          certSoleClaimant: Boolean(input.certSoleClaimant),
          certSpouseLowerBenefit: Boolean(input.certSpouseLowerBenefit),
          spouseLowerAmount: Number(input.spouseLowerAmount || 0).toFixed(2),
          status: input.status || 'submitted',
          approverName: input.approverName?.trim() || '',
          approverPosition: input.approverPosition?.trim() || '',
          approvedDate: input.approvedDate?.trim() || '',
          notes: input.notes?.trim() || '',
        })
        .returning();

      let insertedChildren: (typeof educationClaimChildren.$inferSelect)[] = [];
      if (validChildren.length > 0) {
        insertedChildren = await tx
          .insert(educationClaimChildren)
          .values(
            validChildren.map((ch, idx) => ({
              educationClaimId: inserted.id,
              dependentId: ch.dependentId || null,
              childOrderIndex: ch.childOrderIndex ?? idx + 1,
              childName: ch.childName.trim(),
              childBirthDate: ch.childBirthDate?.trim() || '',
              fatherChildOrder: ch.fatherChildOrder ?? null,
              motherChildOrder: ch.motherChildOrder ?? null,
              replacingDeceasedOrder: ch.replacingDeceasedOrder ?? null,
              deceasedChildName: ch.deceasedChildName?.trim() || '',
              deceasedChildBirthDate: ch.deceasedChildBirthDate?.trim() || '',
              deceasedChildDeathDate: ch.deceasedChildDeathDate?.trim() || '',
              schoolName: ch.schoolName.trim(),
              schoolDistrict: ch.schoolDistrict?.trim() || '',
              schoolProvince: ch.schoolProvince?.trim() || '',
              gradeLevel: ch.gradeLevel.trim(),
              isMaintenanceFee: Boolean(ch.isMaintenanceFee),
              isTuitionFee: Boolean(ch.isTuitionFee),
              amount: Number(ch.amount).toFixed(2),
              receiptNumber: ch.receiptNumber?.trim() || '',
              receiptDate: ch.receiptDate?.trim() || '',
            }))
          )
          .returning();
      }

      return {
        ...inserted,
        children: insertedChildren,
      };
    });
  } catch (error: any) {
    if (error?.message === 'STAFF_NOT_FOUND') throw error;
    console.error('Database query failed in createEducationClaim:', error);
    throw new Error('ไม่สามารถบันทึกใบเบิกค่าการศึกษาของบุตร แบบ 7223 ได้', {
      cause: error,
    });
  }
}

export async function updateEducationClaim(
  userId: number,
  claimId: number,
  input: EducationClaimInput
) {
  try {
    const [existing] = await db
      .select()
      .from(educationClaims)
      .where(and(eq(educationClaims.id, claimId), eq(educationClaims.userId, userId)));

    if (!existing) return null;

    const fiscalYear = input.fiscalYear?.trim() || getThaiFiscalYear(input.claimDate);
    const validChildren = (input.children || []).filter(
      (c) => c.childName.trim() && Number(c.amount) > 0
    );
    const totalAmountNum = validChildren.reduce((s, c) => s + Number(c.amount), 0);
    const claimableNum =
      input.entitlementBasis === 'partial' && input.claimableAmount > 0
        ? Number(input.claimableAmount)
        : totalAmountNum;

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(educationClaims)
        .set({
          staffId: input.staffId,
          claimNumber: input.claimNumber?.trim() || existing.claimNumber,
          fiscalYear,
          academicYear: input.academicYear?.trim() || existing.academicYear,
          semester: input.semester?.trim() || existing.semester,
          claimDate: input.claimDate,
          claimantName: input.claimantName.trim(),
          claimantPosition: input.claimantPosition.trim(),
          claimantAffiliation: input.claimantAffiliation.trim(),
          spouseName: input.spouseName?.trim() || '',
          spouseStatus: input.spouseStatus || 'not_gov',
          spousePosition: input.spousePosition?.trim() || '',
          spouseAffiliation: input.spouseAffiliation?.trim() || '',
          claimantRole: input.claimantRole || 'lawful_father',
          totalAmount: totalAmountNum.toFixed(2),
          totalAmountText: bahtText(totalAmountNum),
          entitlementBasis: input.entitlementBasis || 'full',
          claimableAmount: claimableNum.toFixed(2),
          claimableAmountText: bahtText(claimableNum),
          certHasRight: input.certHasRight ?? true,
          certChildEligible: input.certChildEligible ?? true,
          certSoleClaimant: Boolean(input.certSoleClaimant),
          certSpouseLowerBenefit: Boolean(input.certSpouseLowerBenefit),
          spouseLowerAmount: Number(input.spouseLowerAmount || 0).toFixed(2),
          status: input.status || existing.status,
          approverName: input.approverName?.trim() ?? existing.approverName,
          approverPosition: input.approverPosition?.trim() ?? existing.approverPosition,
          approvedDate: input.approvedDate?.trim() ?? existing.approvedDate,
          notes: input.notes?.trim() ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(and(eq(educationClaims.id, claimId), eq(educationClaims.userId, userId)))
        .returning();

      await tx
        .delete(educationClaimChildren)
        .where(eq(educationClaimChildren.educationClaimId, claimId));

      let insertedChildren: (typeof educationClaimChildren.$inferSelect)[] = [];
      if (validChildren.length > 0) {
        insertedChildren = await tx
          .insert(educationClaimChildren)
          .values(
            validChildren.map((ch, idx) => ({
              educationClaimId: claimId,
              dependentId: ch.dependentId || null,
              childOrderIndex: ch.childOrderIndex ?? idx + 1,
              childName: ch.childName.trim(),
              childBirthDate: ch.childBirthDate?.trim() || '',
              fatherChildOrder: ch.fatherChildOrder ?? null,
              motherChildOrder: ch.motherChildOrder ?? null,
              replacingDeceasedOrder: ch.replacingDeceasedOrder ?? null,
              deceasedChildName: ch.deceasedChildName?.trim() || '',
              deceasedChildBirthDate: ch.deceasedChildBirthDate?.trim() || '',
              deceasedChildDeathDate: ch.deceasedChildDeathDate?.trim() || '',
              schoolName: ch.schoolName.trim(),
              schoolDistrict: ch.schoolDistrict?.trim() || '',
              schoolProvince: ch.schoolProvince?.trim() || '',
              gradeLevel: ch.gradeLevel.trim(),
              isMaintenanceFee: Boolean(ch.isMaintenanceFee),
              isTuitionFee: Boolean(ch.isTuitionFee),
              amount: Number(ch.amount).toFixed(2),
              receiptNumber: ch.receiptNumber?.trim() || '',
              receiptDate: ch.receiptDate?.trim() || '',
            }))
          )
          .returning();
      }

      return {
        ...updated,
        children: insertedChildren,
      };
    });
  } catch (error) {
    console.error('Database query failed in updateEducationClaim:', error);
    throw new Error('ไม่สามารถแก้ไขใบเบิกค่าการศึกษาของบุตร แบบ 7223 ได้', {
      cause: error,
    });
  }
}

export async function updateEducationClaimStatus(
  userId: number,
  claimId: number,
  payload: {
    status: string;
    approverName?: string;
    approverPosition?: string;
    approvedDate?: string;
    notes?: string;
  }
) {
  try {
    const [updated] = await db
      .update(educationClaims)
      .set({
        status: payload.status,
        approverName: payload.approverName?.trim() || '',
        approverPosition: payload.approverPosition?.trim() || '',
        approvedDate: payload.approvedDate?.trim() || '',
        notes: payload.notes?.trim() || '',
        updatedAt: new Date(),
      })
      .where(and(eq(educationClaims.id, claimId), eq(educationClaims.userId, userId)))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('Database query failed in updateEducationClaimStatus:', error);
    throw new Error('ไม่สามารถอัปเดตสถานะใบเบิก แบบ 7223 ได้', { cause: error });
  }
}

export async function deleteEducationClaim(userId: number, claimId: number) {
  try {
    const [deleted] = await db
      .delete(educationClaims)
      .where(and(eq(educationClaims.id, claimId), eq(educationClaims.userId, userId)))
      .returning();

    return deleted || null;
  } catch (error) {
    console.error('Database query failed in deleteEducationClaim:', error);
    throw new Error('ไม่สามารถลบใบเบิกค่าการศึกษาของบุตรได้', { cause: error });
  }
}

// =========================================================================
// UNIFIED ANALYTICS & AUTOMATED REPORTS (7131 + 7223)
// =========================================================================

export async function getReportAnalytics(userId: number, fiscalYear?: string) {
  try {
    const medConditions = [eq(medicalClaims.userId, userId)];
    const eduConditions = [eq(educationClaims.userId, userId)];
    if (fiscalYear && fiscalYear !== 'all') {
      medConditions.push(eq(medicalClaims.fiscalYear, fiscalYear));
      eduConditions.push(eq(educationClaims.fiscalYear, fiscalYear));
    }

    const claims = await db
      .select()
      .from(medicalClaims)
      .where(and(...medConditions))
      .orderBy(desc(medicalClaims.claimDate));

    const eduClaims = await db
      .select()
      .from(educationClaims)
      .where(and(...eduConditions))
      .orderBy(desc(educationClaims.claimDate));

    const staffCountRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId));

    const claimIds = claims.map((c) => c.id);
    const receipts =
      claimIds.length > 0
        ? await db
            .select()
            .from(claimReceipts)
            .where(
              sql`${claimReceipts.claimId} IN (${sql.join(
                claimIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
        : [];

    const eduIds = eduClaims.map((e) => e.id);
    const eduChildren =
      eduIds.length > 0
        ? await db
            .select()
            .from(educationClaimChildren)
            .where(
              sql`${educationClaimChildren.educationClaimId} IN (${sql.join(
                eduIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(asc(educationClaimChildren.childOrderIndex))
        : [];

    // 7131 Medical aggregations
    const totalClaims = claims.length;
    const totalReceiptAmount = claims.reduce((s, c) => s + Number(c.totalAmount), 0);
    const totalClaimableAmount = claims.reduce((s, c) => s + Number(c.claimableAmount), 0);
    const approvedAmount = claims
      .filter((c) => c.status === 'approved' || c.status === 'paid')
      .reduce((s, c) => s + Number(c.claimableAmount), 0);
    const pendingAmount = claims
      .filter((c) => c.status === 'submitted' || c.status === 'draft')
      .reduce((s, c) => s + Number(c.claimableAmount), 0);

    const byPatientType: Record<string, { count: number; amount: number }> = {};
    const byHospitalType: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, { count: number; amount: number }> = {};
    const byMonth: Record<string, { count: number; amount: number }> = {};

    for (const c of claims) {
      if (!byPatientType[c.patientType]) byPatientType[c.patientType] = { count: 0, amount: 0 };
      byPatientType[c.patientType].count += 1;
      byPatientType[c.patientType].amount += Number(c.claimableAmount);

      if (!byHospitalType[c.hospitalType]) byHospitalType[c.hospitalType] = { count: 0, amount: 0 };
      byHospitalType[c.hospitalType].count += 1;
      byHospitalType[c.hospitalType].amount += Number(c.claimableAmount);

      if (!byStatus[c.status]) byStatus[c.status] = { count: 0, amount: 0 };
      byStatus[c.status].count += 1;
      byStatus[c.status].amount += Number(c.claimableAmount);

      const monthKey = c.claimDate.slice(0, 7);
      if (!byMonth[monthKey]) byMonth[monthKey] = { count: 0, amount: 0 };
      byMonth[monthKey].count += 1;
      byMonth[monthKey].amount += Number(c.claimableAmount);
    }

    const byCategory: Record<string, { count: number; amount: number }> = {};
    for (const r of receipts) {
      if (!byCategory[r.category]) byCategory[r.category] = { count: 0, amount: 0 };
      byCategory[r.category].count += 1;
      byCategory[r.category].amount += Number(r.amount);
    }

    // 7223 Education aggregations
    const eduTotalClaims = eduClaims.length;
    const eduTotalPaid = eduClaims.reduce((s, c) => s + Number(c.totalAmount), 0);
    const eduTotalClaimable = eduClaims.reduce((s, c) => s + Number(c.claimableAmount), 0);
    const eduApproved = eduClaims
      .filter((c) => c.status === 'approved' || c.status === 'paid')
      .reduce((s, c) => s + Number(c.claimableAmount), 0);
    const eduPending = eduClaims
      .filter((c) => c.status === 'submitted' || c.status === 'draft')
      .reduce((s, c) => s + Number(c.claimableAmount), 0);

    const eduByStatus: Record<string, { count: number; amount: number }> = {};
    for (const c of eduClaims) {
      if (!eduByStatus[c.status]) eduByStatus[c.status] = { count: 0, amount: 0 };
      eduByStatus[c.status].count += 1;
      eduByStatus[c.status].amount += Number(c.claimableAmount);
    }

    const byGradeLevel: Record<string, { count: number; amount: number }> = {};
    for (const ch of eduChildren) {
      const key = ch.gradeLevel || 'ไม่ระบุชั้นเรียน';
      if (!byGradeLevel[key]) byGradeLevel[key] = { count: 0, amount: 0 };
      byGradeLevel[key].count += 1;
      byGradeLevel[key].amount += Number(ch.amount);
    }

    const medYears = await db
      .selectDistinct({ fiscalYear: medicalClaims.fiscalYear })
      .from(medicalClaims)
      .where(eq(medicalClaims.userId, userId));
    const eduYears = await db
      .selectDistinct({ fiscalYear: educationClaims.fiscalYear })
      .from(educationClaims)
      .where(eq(educationClaims.userId, userId));

    const yearSet = new Set<string>([
      ...medYears.map((y) => y.fiscalYear),
      ...eduYears.map((y) => y.fiscalYear),
    ]);

    const claimsWithReceipts = claims.slice(0, 8).map((c) => ({
      ...c,
      receipts: receipts.filter((r) => r.claimId === c.id),
    }));

    const eduWithChildren = eduClaims.slice(0, 8).map((c) => ({
      ...c,
      children: eduChildren.filter((ch) => ch.educationClaimId === c.id),
    }));

    return {
      summary: {
        totalClaims,
        staffCount: staffCountRes[0]?.count ?? 0,
        totalReceiptAmount,
        totalClaimableAmount,
        approvedAmount,
        pendingAmount,
      },
      byPatientType,
      byHospitalType,
      byStatus,
      byCategory,
      byMonth,
      fiscalYears: Array.from(yearSet).sort().reverse(),
      recentClaims: claimsWithReceipts,
      educationSummary: {
        totalClaims: eduTotalClaims,
        totalChildrenCount: eduChildren.length,
        totalPaidAmount: eduTotalPaid,
        totalClaimableAmount: eduTotalClaimable,
        approvedAmount: eduApproved,
        pendingAmount: eduPending,
        byGradeLevel,
        byStatus: eduByStatus,
        recentEducationClaims: eduWithChildren,
      },
    };
  } catch (error) {
    console.error('Database query failed in getReportAnalytics:', error);
    throw new Error('ไม่สามารถประมวลผลรายงานสรุปสวัสดิการได้', { cause: error });
  }
}

export async function seedSamplePublicHealthData(userId: number) {
  try {
    const existing = await db
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId));

    if (existing.length > 0) {
      return { seeded: false, message: 'มีข้อมูลเจ้าหน้าที่อยู่ในระบบแล้ว' };
    }

    const staff1 = await createStaffProfile(userId, {
      staffCode: 'DP-69001',
      prefix: 'นางสาว',
      fullName: 'กัญญารัตน์ วงศ์สุวรรณ',
      nationalId: '1199900452189',
      position: 'นักวิชาการสาธารณสุขชำนาญการ',
      affiliation: 'สำนักงานสาธารณสุขอำเภอดอนพุด',
      department: 'กลุ่มงานควบคุมโรคติดต่อ',
      phone: '089-412-5580',
      bankName: 'ธนาคารกรุงไทย',
      bankAccount: '112-0-45891-2',
    });

    const staff2 = await createStaffProfile(userId, {
      staffCode: 'DP-69002',
      prefix: 'นาย',
      fullName: 'ธนากร ศรีประเสริฐ',
      nationalId: '1190400281943',
      position: 'พยาบาลวิชาชีพชำนาญการ',
      affiliation: 'สำนักงานสาธารณสุขอำเภอดอนพุด',
      department: 'รพ.สต.ดอนพุด',
      phone: '081-775-3024',
      bankName: 'ธนาคารกรุงไทย',
      bankAccount: '112-6-99204-8',
    });

    const staff3 = await createStaffProfile(userId, {
      staffCode: 'DP-69003',
      prefix: 'นาง',
      fullName: 'สุภาพร เจริญสุข',
      nationalId: '3190200814511',
      position: 'เจ้าพนักงานสาธารณสุขอาวุโส',
      affiliation: 'สำนักงานสาธารณสุขอำเภอดอนพุด',
      department: 'รพ.สต.บ้านหลวง',
      phone: '086-332-1940',
      bankName: 'ธนาคารกรุงไทย',
      bankAccount: '112-1-88340-5',
    });

    await addStaffDependent(userId, staff1.id, {
      relationship: 'mother',
      fullName: 'นางสมศรี วงศ์สุวรรณ',
      nationalId: '3199900112233',
    });

    const child1 = await addStaffDependent(userId, staff2.id, {
      relationship: 'child',
      fullName: 'เด็กชายภูมิพัฒน์ ศรีประเสริฐ',
      nationalId: '1199901882931',
      birthDate: '2019-05-14',
      childOrder: 1,
      isMinor: true,
      isIncapacitated: false,
    });

    const child2 = await addStaffDependent(userId, staff2.id, {
      relationship: 'child',
      fullName: 'เด็กหญิงปภาวรินท์ ศรีประเสริฐ',
      nationalId: '1199902331045',
      birthDate: '2016-09-22',
      childOrder: 2,
      isMinor: true,
      isIncapacitated: false,
    });

    await addStaffDependent(userId, staff2.id, {
      relationship: 'spouse',
      fullName: 'นางวรรณภา ศรีประเสริฐ',
      nationalId: '1190400291820',
    });

    await addStaffDependent(userId, staff3.id, {
      relationship: 'spouse',
      fullName: 'นายสมชาย เจริญสุข',
      nationalId: '3190200774120',
    });

    // Seed Form 7131 Medical Claims
    await createMedicalClaim(userId, {
      staffId: staff1.id,
      claimDate: '2026-10-18',
      claimantName: 'นางสาวกัญญารัตน์ วงศ์สุวรรณ',
      claimantPosition: 'นักวิชาการสาธารณสุขชำนาญการ',
      claimantAffiliation: 'สำนักงานสาธารณสุขอำเภอดอนพุด',
      patientType: 'mother',
      patientName: 'นางสมศรี วงศ์สุวรรณ',
      patientNationalId: '3199900112233',
      diagnosis: 'ความดันโลหิตสูงและไขมันในเลือดสูง (Hypertension & Dyslipidemia)',
      hospitalName: 'โรงพยาบาลดอนพุด',
      hospitalType: 'public',
      treatmentStartDate: '2026-10-15',
      treatmentEndDate: '2026-10-15',
      entitlementBasis: 'full',
      claimableAmount: 1850,
      selfRightsOption: 'none',
      relatedPersonRole: 'มารดา',
      relatedRightsOption: 'none',
      status: 'paid',
      approverName: 'สาธารณสุขอำเภอดอนพุด',
      approverPosition: 'ผู้มีอำนาจอนุมัติ',
      approvedDate: '2026-10-25',
      receipts: [
        {
          receiptNumber: 'DP-69-10421',
          receiptDate: '2026-10-15',
          category: 'ค่ายาและสารอาหารทางเส้นเลือด',
          description: 'ค่ายาลดความดันโลหิตและยาลดไขมัน (60 วัน)',
          amount: 1250,
        },
        {
          receiptNumber: 'DP-69-10422',
          receiptDate: '2026-10-15',
          category: 'ค่าตรวจวินิจฉัยทางห้องปฏิบัติการและรังสี',
          description: 'ค่าตรวจเลือด Lipid Profile และ FBS',
          amount: 600,
        },
      ],
    });

    await createMedicalClaim(userId, {
      staffId: staff3.id,
      claimDate: '2026-11-12',
      claimantName: 'นางสุภาพร เจริญสุข',
      claimantPosition: 'เจ้าพนักงานสาธารณสุขอาวุโส',
      claimantAffiliation: 'สำนักงานสาธารณสุขอำเภอดอนพุด',
      patientType: 'spouse',
      patientName: 'นายสมชาย เจริญสุข',
      patientNationalId: '3190200774120',
      diagnosis: 'อุบัติเหตุข้อเท้าแพลงและกระดูกนิ้วเท้าร้าว',
      hospitalName: 'โรงพยาบาลสระบุรี',
      hospitalType: 'public',
      treatmentStartDate: '2026-11-10',
      treatmentEndDate: '2026-11-10',
      entitlementBasis: 'full',
      claimableAmount: 2450,
      selfRightsOption: 'none',
      relatedPersonRole: 'คู่สมรส',
      relatedRightsOption: 'none',
      status: 'submitted',
      receipts: [
        {
          receiptNumber: 'SRB-69-30114',
          receiptDate: '2026-11-10',
          category: 'ค่าตรวจวินิจฉัยทางห้องปฏิบัติการและรังสี',
          description: 'ค่าเอกซเรย์ข้อเท้า 2 ท่า',
          amount: 1450,
        },
        {
          receiptNumber: 'SRB-69-30115',
          receiptDate: '2026-11-10',
          category: 'ค่าอวัยวะเทียมและอุปกรณ์ทางการแพทย์',
          description: 'ค่าเฝือกอ่อนพยุงข้อเท้า',
          amount: 1000,
        },
      ],
    });

    // Seed Form 7223 Education Claims
    await createEducationClaim(userId, {
      staffId: staff2.id,
      academicYear: '2569',
      semester: '2',
      claimDate: '2026-11-08',
      claimantName: 'นายธนากร ศรีประเสริฐ',
      claimantPosition: 'พยาบาลวิชาชีพชำนาญการ',
      claimantAffiliation: 'สำนักงานสาธารณสุขอำเภอดอนพุด',
      spouseName: 'นางวรรณภา ศรีประเสริฐ',
      spouseStatus: 'not_gov',
      spousePosition: '',
      spouseAffiliation: '',
      claimantRole: 'lawful_father',
      entitlementBasis: 'full',
      claimableAmount: 4800,
      certHasRight: true,
      certChildEligible: true,
      certSoleClaimant: true,
      certSpouseLowerBenefit: false,
      spouseLowerAmount: 0,
      status: 'approved',
      approverName: 'นายแพทย์สาธารณสุขจังหวัดสระบุรี',
      approverPosition: 'ผู้มีอำนาจอนุมัติ',
      approvedDate: '2026-11-14',
      children: [
        {
          dependentId: child1?.id || null,
          childOrderIndex: 1,
          childName: 'เด็กชายภูมิพัฒน์ ศรีประเสริฐ',
          childBirthDate: '2019-05-14',
          fatherChildOrder: 1,
          motherChildOrder: 1,
          schoolName: 'โรงเรียนอนุบาลดอนพุด',
          schoolDistrict: 'ดอนพุด',
          schoolProvince: 'สระบุรี',
          gradeLevel: 'ประถมศึกษาปีที่ 1',
          isMaintenanceFee: true,
          isTuitionFee: false,
          amount: 2100,
          receiptNumber: 'EDU-69-0112',
          receiptDate: '2026-11-02',
        },
        {
          dependentId: child2?.id || null,
          childOrderIndex: 2,
          childName: 'เด็กหญิงปภาวรินท์ ศรีประเสริฐ',
          childBirthDate: '2016-09-22',
          fatherChildOrder: 2,
          motherChildOrder: 2,
          schoolName: 'โรงเรียนสระบุรีวิทยาคม',
          schoolDistrict: 'เมืองสระบุรี',
          schoolProvince: 'สระบุรี',
          gradeLevel: 'ประถมศึกษาปีที่ 4',
          isMaintenanceFee: true,
          isTuitionFee: true,
          amount: 2700,
          receiptNumber: 'SBW-69-4410',
          receiptDate: '2026-11-04',
        },
      ],
    });

    return {
      seeded: true,
      message: 'นำเข้าข้อมูลตัวอย่างสำนักงานสาธารณสุขอำเภอดอนพุด (แบบ 7131 และ 7223) สำเร็จ',
    };
  } catch (error) {
    console.error('Database query failed in seedSamplePublicHealthData:', error);
    throw new Error('ไม่สามารถนำเข้าข้อมูลตัวอย่างได้', { cause: error });
  }
}

export async function exportUserDatabaseBackup(userId: number, fiscalYear?: string) {
  try {
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const staffRows = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId))
      .orderBy(asc(staffProfiles.id));

    const staffIds = staffRows.map((s) => s.id);
    const dependentRows =
      staffIds.length > 0
        ? await db
            .select()
            .from(staffDependents)
            .where(
              sql`${staffDependents.staffId} IN (${sql.join(
                staffIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(asc(staffDependents.id))
        : [];

    const medConditions = [eq(medicalClaims.userId, userId)];
    const eduConditions = [eq(educationClaims.userId, userId)];
    if (fiscalYear && fiscalYear !== 'all') {
      medConditions.push(eq(medicalClaims.fiscalYear, fiscalYear));
      eduConditions.push(eq(educationClaims.fiscalYear, fiscalYear));
    }

    const medicalClaimRows = await db
      .select()
      .from(medicalClaims)
      .where(and(...medConditions))
      .orderBy(asc(medicalClaims.id));

    const medIds = medicalClaimRows.map((c) => c.id);
    const receiptRows =
      medIds.length > 0
        ? await db
            .select()
            .from(claimReceipts)
            .where(
              sql`${claimReceipts.claimId} IN (${sql.join(
                medIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(asc(claimReceipts.id))
        : [];

    const educationClaimRows = await db
      .select()
      .from(educationClaims)
      .where(and(...eduConditions))
      .orderBy(asc(educationClaims.id));

    const eduIds = educationClaimRows.map((e) => e.id);
    const educationChildRows =
      eduIds.length > 0
        ? await db
            .select()
            .from(educationClaimChildren)
            .where(
              sql`${educationClaimChildren.educationClaimId} IN (${sql.join(
                eduIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(asc(educationClaimChildren.id))
        : [];

    return {
      users: userRows,
      staff_profiles: staffRows,
      staff_dependents: dependentRows,
      medical_claims: medicalClaimRows,
      claim_receipts: receiptRows,
      education_claims: educationClaimRows,
      education_claim_children: educationChildRows,
    };
  } catch (error) {
    console.error('Database query failed in exportUserDatabaseBackup:', error);
    throw new Error('ไม่สามารถส่งออกไฟล์สำรองข้อมูลได้', { cause: error });
  }
}

