import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Plus,
  Printer,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { EducationClaim, MedicalClaim, ReportAnalytics } from '../types/medical';
import {
  CLAIM_STATUS_LABELS,
  HOSPITAL_TYPE_LABELS,
  PATIENT_TYPE_LABELS,
  formatCurrency,
  formatThaiDate,
} from '../lib/thai-utils';

interface Props {
  analytics: ReportAnalytics | null;
  claims: MedicalClaim[];
  educationClaims: EducationClaim[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  onOpenNewClaim: () => void;
  onOpenNewEducationClaim: () => void;
  onPrintClaim: (claim: MedicalClaim) => void;
  onPrintEducationClaim: (claim: EducationClaim) => void;
  onSeedDemo: () => Promise<void>;
  onDownloadBackup: (format: 'sql' | 'csv', table?: string) => Promise<void>;
  seeding: boolean;
  loading: boolean;
}

const BACKUP_TABLE_OPTIONS = [
  { key: 'staff_profiles', label: 'ทะเบียนเจ้าหน้าที่' },
  { key: 'staff_dependents', label: 'บุคคลในครอบครัว' },
  { key: 'medical_claims', label: 'ใบเบิก แบบ 7131' },
  { key: 'claim_receipts', label: 'ใบเสร็จ แบบ 7131' },
  { key: 'education_claims', label: 'ใบเบิก แบบ 7223' },
  { key: 'education_claim_children', label: 'รายการบุตร แบบ 7223' },
];

export function DashboardReportsView({
  analytics,
  claims,
  educationClaims,
  selectedYear,
  onSelectYear,
  onOpenNewClaim,
  onOpenNewEducationClaim,
  onPrintClaim,
  onPrintEducationClaim,
  onSeedDemo,
  onDownloadBackup,
  seeding,
  loading,
}: Props) {
  const [reportScope, setReportScope] = useState<'7131' | '7223'>('7131');
  const [showAnnualPrint, setShowAnnualPrint] = useState(false);
  const [backupMenuOpen, setBackupMenuOpen] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const backupMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!backupMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (backupMenuRef.current && !backupMenuRef.current.contains(e.target as Node)) {
        setBackupMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBackupMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [backupMenuOpen]);

  const triggerBackupDownload = async (format: 'sql' | 'csv', table = 'all') => {
    setDownloadingBackup(true);
    try {
      await onDownloadBackup(format, table);
      setBackupMenuOpen(false);
    } finally {
      setDownloadingBackup(false);
    }
  };

  const categoryRows = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.byCategory).sort((a, b) => b[1].amount - a[1].amount);
  }, [analytics]);

  const patientRows = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.byPatientType).sort((a, b) => b[1].amount - a[1].amount);
  }, [analytics]);

  const gradeRows = useMemo(() => {
    if (!analytics?.educationSummary) return [];
    return Object.entries(analytics.educationSummary.byGradeLevel).sort(
      (a, b) => b[1].amount - a[1].amount
    );
  }, [analytics]);

  const maxCategoryAmount = useMemo(() => {
    if (categoryRows.length === 0) return 1;
    return Math.max(...categoryRows.map(([, v]) => v.amount), 1);
  }, [categoryRows]);

  const maxGradeAmount = useMemo(() => {
    if (gradeRows.length === 0) return 1;
    return Math.max(...gradeRows.map(([, v]) => v.amount), 1);
  }, [gradeRows]);

  const escapeCsv = (val: unknown) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCsv = () => {
    if (reportScope === '7131') {
      const filtered =
        selectedYear === 'all'
          ? claims
          : claims.filter((c) => c.fiscalYear === selectedYear);

      const headers = [
        'เลขที่ใบเบิก',
        'ปีงบประมาณ',
        'วันที่ยื่นเบิก',
        'ผู้ขอเบิก',
        'ตำแหน่ง',
        'สังกัด',
        'ผู้ป่วย',
        'ชื่อผู้ป่วย',
        'โรค/การวินิจฉัย',
        'สถานพยาบาล',
        'ประเภทสถานพยาบาล',
        'จำนวนใบเสร็จ',
        'ยอดเบิกตามสิทธิ (บาท)',
        'สถานะ',
      ];

      const rows = filtered.map((c) => [
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
        c.hospitalType === 'public' ? 'ทางราชการ' : 'เอกชน',
        c.receiptCount,
        Number(c.claimableAmount).toFixed(2),
        CLAIM_STATUS_LABELS[c.status] || c.status,
      ]);

      const csvContent =
        '\uFEFF' +
        [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join(
          '\n'
        );

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `รายงานเบิกค่ารักษา_แบบ7131_${selectedYear === 'all' ? 'ทั้งหมด' : `ปี${selectedYear}`}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const filtered =
        selectedYear === 'all'
          ? educationClaims
          : educationClaims.filter((c) => c.fiscalYear === selectedYear);

      const headers = [
        'เลขที่ใบเบิก',
        'ปีงบประมาณ',
        'ปีการศึกษา',
        'ภาคเรียน',
        'วันที่ยื่นเบิก',
        'ผู้ขอเบิก',
        'ตำแหน่ง',
        'สังกัด',
        'จำนวนบุตรที่เบิก',
        'รายชื่อบุตรและสถานศึกษา',
        'ยอดเบิกตามสิทธิ (บาท)',
        'สถานะ',
      ];

      const rows = filtered.map((c) => [
        c.claimNumber,
        c.fiscalYear,
        c.academicYear,
        c.semester,
        c.claimDate,
        c.claimantName,
        c.claimantPosition,
        c.claimantAffiliation,
        c.children.length,
        c.children.map((ch) => `${ch.childName} (${ch.schoolName} - ${ch.gradeLevel})`).join(' | '),
        Number(c.claimableAmount).toFixed(2),
        CLAIM_STATUS_LABELS[c.status] || c.status,
      ]);

      const csvContent =
        '\uFEFF' +
        [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join(
          '\n'
        );

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `รายงานเบิกค่าการศึกษาบุตร_แบบ7223_${selectedYear === 'all' ? 'ทั้งหมด' : `ปี${selectedYear}`}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white border border-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-xl" />
      </div>
    );
  }

  const summary = analytics?.summary ?? {
    totalClaims: 0,
    staffCount: 0,
    totalReceiptAmount: 0,
    totalClaimableAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
  };

  const eduSummary = analytics?.educationSummary ?? {
    totalClaims: 0,
    totalChildrenCount: 0,
    totalPaidAmount: 0,
    totalClaimableAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    byGradeLevel: {},
    byStatus: {},
    recentEducationClaims: [],
  };

  if (summary.staffCount === 0 && summary.totalClaims === 0 && eduSummary.totalClaims === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto mt-6">
        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          ยังไม่มีข้อมูลเจ้าหน้าที่และใบเบิกเงินสวัสดิการในฐานข้อมูล SQL
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          เริ่มต้นใช้งานระบบใบเบิกเงินสวัสดิการ สำนักงานสาธารณสุขอำเภอดอนพุด
          โดยนำเข้าข้อมูลตัวอย่าง (แบบ 7131 และ แบบ 7223) หรือบันทึกใบเบิกฉบับใหม่
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onSeedDemo}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? 'กำลังนำเข้าข้อมูล...' : 'นำเข้าข้อมูลตัวอย่าง (สสอ.ดอนพุด)'}
          </button>
          <button
            type="button"
            onClick={onOpenNewClaim}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            สร้างแบบ 7131
          </button>
          <button
            type="button"
            onClick={onOpenNewEducationClaim}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <GraduationCap className="w-4 h-4" />
            สร้างแบบ 7223
          </button>
        </div>
      </div>
    );
  }

  const combinedClaimable = summary.totalClaimableAmount + eduSummary.totalClaimableAmount;
  const combinedApproved = summary.approvedAmount + eduSummary.approvedAmount;
  const combinedPending = summary.pendingAmount + eduSummary.pendingAmount;

  return (
    <div className="space-y-6">
      {/* Automated Report Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4">
        <div className="space-y-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              รายงานสรุปการเบิกเงินสวัสดิการ สำนักงานสาธารณสุขอำเภอดอนพุด
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ครอบคลุมสวัสดิการรักษาพยาบาล (แบบ 7131) และสวัสดิการการศึกษาของบุตร (แบบ 7223) จากฐานข้อมูล PostgreSQL
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setReportScope('7131')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                reportScope === '7131'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แบบ 7131 · รักษาพยาบาล ({summary.totalClaims})
            </button>
            <button
              type="button"
              onClick={() => setReportScope('7223')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                reportScope === '7223'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แบบ 7223 · การศึกษาบุตร ({eduSummary.totalClaims})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedYear}
            onChange={(e) => onSelectYear(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="all">ปีงบประมาณทั้งหมด</option>
            {(analytics?.fiscalYears || []).map((y) => (
              <option key={y} value={y}>
                ปีงบประมาณ {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV ({reportScope})
          </button>

          {/* Annual Database Backup Menu (SQL Dump / CSV) */}
          <div className="relative" ref={backupMenuRef}>
            <button
              type="button"
              disabled={downloadingBackup}
              onClick={() => setBackupMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-teal-700" />
              <span>{downloadingBackup ? 'กำลังส่งออก...' : 'สำรองข้อมูลประจำปี'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {backupMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 z-30">
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      สำรองฐานข้อมูลประจำปี
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ขอบเขต:{' '}
                      {selectedYear === 'all'
                        ? 'ทุกปีงบประมาณ'
                        : `ปีงบประมาณ พ.ศ. ${selectedYear}`}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-800">
                    7 ตารางหลัก
                  </span>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    disabled={downloadingBackup}
                    onClick={() => triggerBackupDownload('sql', 'all')}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 text-left transition-colors"
                  >
                    <Database className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">
                        ดาวน์โหลด SQL Dump (.sql)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">
                        โครงสร้างตาราง + คำสั่ง INSERT PostgreSQL ทั้งหมด
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingBackup}
                    onClick={() => triggerBackupDownload('csv', 'all')}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 text-left transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">
                        ดาวน์โหลด CSV รวมทุกตาราง (.csv)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">
                        ข้อมูลทั้ง 7 ตารางในไฟล์เดียว (รองรับ Excel ภาษาไทย)
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                    หรือดาวน์โหลด CSV แยกรายตาราง
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BACKUP_TABLE_OPTIONS.map((tbl) => (
                      <button
                        key={tbl.key}
                        type="button"
                        disabled={downloadingBackup}
                        onClick={() => triggerBackupDownload('csv', tbl.key)}
                        className="px-2 py-1.5 text-[11px] text-left text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md truncate transition-colors"
                        title={`ดาวน์โหลด ${tbl.key}.csv`}
                      >
                        {tbl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAnnualPrint(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์รายงานสรุป ({reportScope})
          </button>
        </div>
      </div>

      {/* 4-Column Combined KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>ยอดขอเบิกสวัสดิการรวมทั้ง 2 ระบบ</span>
            <Wallet className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums">
            {formatCurrency(combinedClaimable)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-mono-nums">
            7131: {formatCurrency(summary.totalClaimableAmount)} · 7223: {formatCurrency(eduSummary.totalClaimableAmount)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>อนุมัติ / เบิกจ่ายแล้วรวม</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono-nums">
            {formatCurrency(combinedApproved)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-mono-nums">
            7131: {formatCurrency(summary.approvedAmount)} · 7223: {formatCurrency(eduSummary.approvedAmount)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>อยู่ระหว่างตรวจสอบรวม</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono-nums">
            {formatCurrency(combinedPending)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-mono-nums">
            บาท · รอพิจารณา/ฉบับร่าง
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>ทะเบียนเจ้าหน้าที่ / ใบเบิกทั้งหมด</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums">
            {summary.staffCount} <span className="text-sm font-normal text-slate-500">คน</span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-mono-nums">
            7131: {summary.totalClaims} ฉบับ · 7223: {eduSummary.totalClaims} ฉบับ ({eduSummary.totalChildrenCount} บุตร)
          </div>
        </div>
      </div>

      {/* Scope-specific Analytics & Recent Table */}
      {reportScope === '7131' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  แบบ 7131 · สรุปค่ารักษาพยาบาลจำแนกตามหมวดค่าใช้จ่าย
                </h3>
                <span className="text-xs text-slate-500 font-mono-nums">
                  {categoryRows.length} หมวด
                </span>
              </div>
              {categoryRows.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  ยังไม่มีข้อมูลใบเสร็จค่ารักษาพยาบาล
                </p>
              ) : (
                <div className="space-y-3.5">
                  {categoryRows.map(([cat, stats]) => {
                    const pct = Math.max(4, Math.round((stats.amount / maxCategoryAmount) * 100));
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-4 text-xs">
                          <span className="font-medium text-slate-800 truncate">{cat}</span>
                          <span className="font-mono-nums text-slate-900 font-semibold whitespace-nowrap shrink-0">
                            {formatCurrency(stats.amount)} บาท ({stats.count} รายการ)
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-700 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-3">
                  จำแนกตามบุคคลผู้เข้ารับการรักษา
                </h3>
                {patientRows.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">ไม่มีข้อมูล</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100">
                        <th className="py-2 text-left font-medium">ประเภทผู้ป่วย</th>
                        <th className="py-2 text-right font-medium">จำนวน</th>
                        <th className="py-2 text-right font-medium">ยอดเบิก (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientRows.map(([type, stats]) => (
                        <tr key={type}>
                          <td className="py-2.5 font-medium text-slate-800">
                            {PATIENT_TYPE_LABELS[type] || type}
                          </td>
                          <td className="py-2.5 text-right font-mono-nums text-slate-600">
                            {stats.count} ฉบับ
                          </td>
                          <td className="py-2.5 text-right font-mono-nums font-semibold text-slate-900">
                            {formatCurrency(stats.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-3">
                  จำแนกตามประเภทสถานพยาบาล
                </h3>
                <div className="space-y-2.5 text-xs">
                  {(['public', 'private'] as const).map((hType) => {
                    const stats = analytics?.byHospitalType[hType] || { count: 0, amount: 0 };
                    return (
                      <div
                        key={hType}
                        className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
                      >
                        <div>
                          <div className="font-medium text-slate-800">
                            {HOSPITAL_TYPE_LABELS[hType]}
                          </div>
                          <div className="text-slate-500 font-mono-nums">{stats.count} ใบเบิก</div>
                        </div>
                        <div className="text-sm font-semibold font-mono-nums text-slate-900">
                          {formatCurrency(stats.amount)} บาท
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                รายการใบเบิกเงินสวัสดิการรักษาพยาบาลล่าสุด (แบบ 7131)
              </h3>
              <span className="text-xs text-slate-500">คลิกเพื่อพิมพ์แบบฟอร์ม 7131</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">เลขที่ใบเบิก</th>
                    <th className="px-4 py-3 text-left font-semibold">วันที่ยื่น</th>
                    <th className="px-4 py-3 text-left font-semibold">เจ้าหน้าที่ผู้เบิก</th>
                    <th className="px-4 py-3 text-left font-semibold">ผู้ป่วย / สถานพยาบาล</th>
                    <th className="px-4 py-3 text-right font-semibold">ยอดเบิก (บาท)</th>
                    <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                    <th className="px-4 py-3 text-right font-semibold">แบบ 7131</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analytics?.recentClaims || []).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono-nums font-medium text-slate-900 whitespace-nowrap">
                        {c.claimNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatThaiDate(c.claimDate, true)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{c.claimantName}</div>
                        <div className="text-slate-500 truncate max-w-[200px]">
                          {c.claimantPosition}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">
                          {PATIENT_TYPE_LABELS[c.patientType]}
                          {c.patientType !== 'self' && c.patientName ? ` · ${c.patientName}` : ''}
                        </div>
                        <div className="text-slate-500 truncate max-w-[240px]">
                          {c.hospitalName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-nums font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(c.claimableAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusText status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onPrintClaim(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-teal-600 hover:text-teal-700 rounded-md text-slate-700 font-medium transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          แบบ 7131
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Form 7223 Education Analytics */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                แบบ 7223 · สรุปค่าการศึกษาของบุตรจำแนกตามระดับชั้นเรียน
              </h3>
              <span className="text-xs text-slate-500 font-mono-nums">
                รวมบุตร {eduSummary.totalChildrenCount} คน · {gradeRows.length} ระดับชั้น
              </span>
            </div>
            {gradeRows.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                ยังไม่มีข้อมูลใบเบิกค่าการศึกษาของบุตร (แบบ 7223)
              </p>
            ) : (
              <div className="space-y-3.5">
                {gradeRows.map(([grade, stats]) => {
                  const pct = Math.max(4, Math.round((stats.amount / maxGradeAmount) * 100));
                  return (
                    <div key={grade} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-4 text-xs">
                        <span className="font-medium text-slate-800 truncate">{grade}</span>
                        <span className="font-mono-nums text-slate-900 font-semibold whitespace-nowrap shrink-0">
                          {formatCurrency(stats.amount)} บาท ({stats.count} คน)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-700 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                รายการใบเบิกค่าการศึกษาของบุตรล่าสุด (แบบ 7223)
              </h3>
              <span className="text-xs text-slate-500">คลิกเพื่อพิมพ์แบบฟอร์ม 7223</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">เลขที่ใบเบิก</th>
                    <th className="px-4 py-3 text-left font-semibold">วันที่ยื่น</th>
                    <th className="px-4 py-3 text-left font-semibold">เจ้าหน้าที่ผู้เบิก</th>
                    <th className="px-4 py-3 text-left font-semibold">รายชื่อบุตร / สถานศึกษา</th>
                    <th className="px-4 py-3 text-right font-semibold">ยอดเบิก (บาท)</th>
                    <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                    <th className="px-4 py-3 text-right font-semibold">แบบ 7223</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(eduSummary.recentEducationClaims || []).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono-nums font-medium text-slate-900 whitespace-nowrap">
                        {c.claimNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatThaiDate(c.claimDate, true)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{c.claimantName}</div>
                        <div className="text-slate-500 truncate max-w-[200px]">
                          {c.claimantPosition}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.children.map((ch, i) => (
                          <div key={ch.id ?? i} className="truncate max-w-[250px]">
                            {ch.childName} · {ch.schoolName} ({ch.gradeLevel})
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-nums font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(c.claimableAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusText status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onPrintEducationClaim(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-teal-600 hover:text-teal-700 rounded-md text-slate-700 font-medium transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          แบบ 7223
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Annual Automated Print Report Modal */}
      {showAnnualPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto print-only-container">
          <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">
              รายงานสรุปการเบิกเงินสวัสดิการ (แบบ {reportScope}) · สำนักงานสาธารณสุขอำเภอดอนพุด
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg"
              >
                <Printer className="w-4 h-4" />
                พิมพ์รายงาน / บันทึก PDF
              </button>
              <button
                type="button"
                onClick={() => setShowAnnualPrint(false)}
                className="px-3 py-2 border border-slate-300 bg-white text-slate-700 text-xs font-medium rounded-lg"
              >
                ปิด
              </button>
            </div>
          </div>

          <div className="py-8 px-4 print:p-0 flex justify-center">
            <div className="print-page font-form-7131 bg-white text-black w-full max-w-[210mm] p-[14mm] shadow-xl border border-slate-200 text-[13px] leading-relaxed">
              <div className="text-center border-b-2 border-black pb-3 mb-4">
                <h1 className="text-[17px] font-bold">
                  {reportScope === '7131'
                    ? 'รายงานสรุปการเบิกเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล (แบบ 7131)'
                    : 'รายงานสรุปการเบิกเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร (แบบ 7223)'}
                </h1>
                <p className="text-[13px]">
                  สำนักงานสาธารณสุขอำเภอดอนพุด ·{' '}
                  {selectedYear === 'all'
                    ? 'รวมทุกปีงบประมาณ'
                    : `ประจำปีงบประมาณ พ.ศ. ${selectedYear}`}
                </p>
              </div>

              {reportScope === '7131' ? (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-5 text-center">
                    <div className="border border-black p-2.5">
                      <div className="text-[11px]">จำนวนใบเบิก 7131</div>
                      <div className="text-[16px] font-bold font-mono-nums">
                        {summary.totalClaims} ฉบับ
                      </div>
                    </div>
                    <div className="border border-black p-2.5">
                      <div className="text-[11px]">ยอดใบเสร็จรวม</div>
                      <div className="text-[16px] font-bold font-mono-nums">
                        {formatCurrency(summary.totalReceiptAmount)}
                      </div>
                    </div>
                    <div className="border border-black p-2.5">
                      <div className="text-[11px]">ยอดเบิกตามสิทธิ</div>
                      <div className="text-[16px] font-bold font-mono-nums">
                        {formatCurrency(summary.totalClaimableAmount)}
                      </div>
                    </div>
                    <div className="border border-black p-2.5">
                      <div className="text-[11px]">อนุมัติ / จ่ายแล้ว</div>
                      <div className="text-[16px] font-bold font-mono-nums">
                        {formatCurrency(summary.approvedAmount)}
                      </div>
                    </div>
                  </div>
                  <table className="w-full border-collapse border border-black text-[11.5px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black px-2 py-1.5 text-left">เลขที่</th>
                        <th className="border border-black px-2 py-1.5 text-left">วันที่ยื่น</th>
                        <th className="border border-black px-2 py-1.5 text-left">เจ้าหน้าที่ผู้เบิก</th>
                        <th className="border border-black px-2 py-1.5 text-left">ผู้ป่วย</th>
                        <th className="border border-black px-2 py-1.5 text-left">สถานพยาบาล</th>
                        <th className="border border-black px-2 py-1.5 text-right">ยอดเบิก (บาท)</th>
                        <th className="border border-black px-2 py-1.5 text-left">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedYear === 'all'
                        ? claims
                        : claims.filter((c) => c.fiscalYear === selectedYear)
                      ).map((c) => (
                        <tr key={c.id}>
                          <td className="border border-black px-2 py-1 font-mono-nums">
                            {c.claimNumber}
                          </td>
                          <td className="border border-black px-2 py-1">
                            {formatThaiDate(c.claimDate, true)}
                          </td>
                          <td className="border border-black px-2 py-1">{c.claimantName}</td>
                          <td className="border border-black px-2 py-1">
                            {PATIENT_TYPE_LABELS[c.patientType]}
                            {c.patientType !== 'self' && c.patientName ? ` (${c.patientName})` : ''}
                          </td>
                          <td className="border border-black px-2 py-1">{c.hospitalName}</td>
                          <td className="border border-black px-2 py-1 text-right font-mono-nums">
                            {formatCurrency(c.claimableAmount)}
                          </td>
                          <td className="border border-black px-2 py-1">
                            {CLAIM_STATUS_LABELS[c.status] || c.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-5 text-center">
                    <div className="border border-black p-2.5">
                      <div className="text-[11px]">จำนวนใบเบิก 7223</div>
                      <div className="text-[16px] font-bold font-mono-nums">
                        {eduSummary.totalClaims} ฉบับ
                      </div>
                    </div>
                    <div className="border border-black p-2.5">
                      <div className="text-[11px]">จำนวนบุตรที่เบิก</div>
                      <div className="text-[16px] font-bold font-mono-nums">
                        {eduSummary.totalChildrenCount} คน
                      </div>
                    </div>
                    <div className="border border-black p-2.5">
                      <div className="text-[11px]">ยอดเบิกตามสิทธิ</div>
                      <div className="text-[16px] font-bold font-mono-nums">
                        {formatCurrency(eduSummary.totalClaimableAmount)}
                      </div>
                    </div>
                    <div className="border border-black p-2.5">
                      <div className="text-[11px]">อนุมัติ / จ่ายแล้ว</div>
                      <div className="text-[16px] font-bold font-mono-nums">
                        {formatCurrency(eduSummary.approvedAmount)}
                      </div>
                    </div>
                  </div>
                  <table className="w-full border-collapse border border-black text-[11.5px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black px-2 py-1.5 text-left">เลขที่</th>
                        <th className="border border-black px-2 py-1.5 text-left">วันที่ยื่น</th>
                        <th className="border border-black px-2 py-1.5 text-left">เจ้าหน้าที่ผู้เบิก</th>
                        <th className="border border-black px-2 py-1.5 text-left">บุตรและสถานศึกษา</th>
                        <th className="border border-black px-2 py-1.5 text-right">ยอดเบิก (บาท)</th>
                        <th className="border border-black px-2 py-1.5 text-left">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedYear === 'all'
                        ? educationClaims
                        : educationClaims.filter((c) => c.fiscalYear === selectedYear)
                      ).map((c) => (
                        <tr key={c.id}>
                          <td className="border border-black px-2 py-1 font-mono-nums">
                            {c.claimNumber}
                          </td>
                          <td className="border border-black px-2 py-1">
                            {formatThaiDate(c.claimDate, true)}
                          </td>
                          <td className="border border-black px-2 py-1">{c.claimantName}</td>
                          <td className="border border-black px-2 py-1">
                            {c.children
                              .map((ch) => `${ch.childName} (${ch.schoolName} ${ch.gradeLevel})`)
                              .join(', ')}
                          </td>
                          <td className="border border-black px-2 py-1 text-right font-mono-nums">
                            {formatCurrency(c.claimableAmount)}
                          </td>
                          <td className="border border-black px-2 py-1">
                            {CLAIM_STATUS_LABELS[c.status] || c.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusText({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'text-slate-600',
    submitted: 'text-amber-700 font-medium',
    approved: 'text-teal-700 font-medium',
    paid: 'text-emerald-700 font-semibold',
    rejected: 'text-red-700 font-medium',
  };
  return (
    <span className={styles[status] || 'text-slate-700'}>
      {CLAIM_STATUS_LABELS[status] || status}
    </span>
  );
}
