export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  googleSpreadsheetId?: string | null;
  googleSpreadsheetTitle?: string | null;
  googleSpreadsheetUrl?: string | null;
  lastSheetSyncAt?: string | null;
  lastSheetSyncStatus?: 'idle' | 'success' | 'error' | string | null;
  lastSheetSyncError?: string | null;
}

export interface StaffDependent {
  id: number;
  staffId: number;
  relationship: 'spouse' | 'father' | 'mother' | 'child' | string;
  fullName: string;
  nationalId: string;
  birthDate: string | null;
  childOrder: number | null;
  isMinor: boolean | null;
  isIncapacitated: boolean | null;
}

export interface StaffProfile {
  id: number;
  userId: number;
  staffCode: string;
  prefix: string;
  fullName: string;
  nationalId: string;
  position: string;
  affiliation: string;
  department: string;
  phone: string | null;
  bankName: string | null;
  bankAccount: string | null;
  dependents: StaffDependent[];
  claimCount?: number;
  totalClaimed?: string;
  educationClaimCount?: number;
  totalEducationClaimed?: string;
}

export interface ClaimReceipt {
  id?: number;
  claimId?: number;
  receiptNumber: string;
  receiptDate: string;
  category: string;
  description: string;
  amount: string | number;
}

export interface MedicalClaim {
  id: number;
  userId: number;
  staffId: number;
  claimNumber: string;
  fiscalYear: string;
  claimDate: string;
  claimantName: string;
  claimantPosition: string;
  claimantAffiliation: string;
  patientType: 'self' | 'spouse' | 'father' | 'mother' | 'child' | string;
  patientName: string | null;
  patientNationalId: string | null;
  childBirthDate: string | null;
  childOrder: number | null;
  isMinor: boolean | null;
  isIncapacitated: boolean | null;
  diagnosis: string;
  hospitalName: string;
  hospitalType: 'public' | 'private' | string;
  treatmentStartDate: string;
  treatmentEndDate: string;
  totalAmount: string;
  totalAmountText: string;
  receiptCount: number;
  entitlementBasis: 'full' | 'excess_other_agency' | 'excess_insurance' | string;
  claimableAmount: string;
  claimableAmountText: string;
  selfRightsOption: 'none' | 'choose_gov' | 'insurance' | 'sole_child_claimant' | string;
  relatedPersonRole: string | null;
  relatedRightsOption:
    | 'none'
    | 'lower_than_decree'
    | 'insurance'
    | 'dependent_of_other'
    | ''
    | null;
  status: 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected' | string;
  approverName: string | null;
  approverPosition: string | null;
  approvedDate: string | null;
  notes: string | null;
  createdAt?: string;
  staff?: StaffProfile | null;
  receipts: ClaimReceipt[];
}

export interface EducationClaimChild {
  id?: number;
  educationClaimId?: number;
  dependentId?: number | null;
  childOrderIndex: number;
  childName: string;
  childBirthDate: string | null;
  fatherChildOrder: number | null;
  motherChildOrder: number | null;
  replacingDeceasedOrder?: number | null;
  deceasedChildName?: string | null;
  deceasedChildBirthDate?: string | null;
  deceasedChildDeathDate?: string | null;
  schoolName: string;
  schoolDistrict: string | null;
  schoolProvince: string | null;
  gradeLevel: string;
  isMaintenanceFee: boolean;
  isTuitionFee: boolean;
  amount: string | number;
  receiptNumber?: string | null;
  receiptDate?: string | null;
}

export interface EducationClaim {
  id: number;
  userId: number;
  staffId: number;
  claimNumber: string;
  fiscalYear: string;
  academicYear: string;
  semester: string;
  claimDate: string;
  claimantName: string;
  claimantPosition: string;
  claimantAffiliation: string;
  spouseName: string | null;
  spouseStatus: 'not_gov' | 'gov_officer' | 'permanent_employee' | 'state_enterprise_or_other' | string;
  spousePosition: string | null;
  spouseAffiliation: string | null;
  claimantRole: 'lawful_father' | 'mother' | string;
  totalAmount: string;
  totalAmountText: string;
  entitlementBasis: 'full' | 'partial' | string;
  claimableAmount: string;
  claimableAmountText: string;
  certHasRight: boolean;
  certChildEligible: boolean;
  certSoleClaimant: boolean;
  certSpouseLowerBenefit: boolean;
  spouseLowerAmount: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected' | string;
  approverName: string | null;
  approverPosition: string | null;
  approvedDate: string | null;
  notes: string | null;
  createdAt?: string;
  staff?: StaffProfile | null;
  children: EducationClaimChild[];
}

export interface ReportAnalytics {
  summary: {
    totalClaims: number;
    staffCount: number;
    totalReceiptAmount: number;
    totalClaimableAmount: number;
    approvedAmount: number;
    pendingAmount: number;
  };
  byPatientType: Record<string, { count: number; amount: number }>;
  byHospitalType: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
  byCategory: Record<string, { count: number; amount: number }>;
  byMonth: Record<string, { count: number; amount: number }>;
  fiscalYears: string[];
  recentClaims: MedicalClaim[];
  educationSummary: {
    totalClaims: number;
    totalChildrenCount: number;
    totalPaidAmount: number;
    totalClaimableAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    byGradeLevel: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, { count: number; amount: number }>;
    recentEducationClaims: EducationClaim[];
  };
}
