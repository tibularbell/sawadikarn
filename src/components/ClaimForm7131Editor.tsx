import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Printer, Save, Trash2, UserCheck, ArrowLeft } from 'lucide-react';
import { ClaimReceipt, MedicalClaim, StaffDependent, StaffProfile } from '../types/medical';
import {
  EXPENSE_CATEGORIES,
  PATIENT_TYPE_LABELS,
  bahtText,
  formatCurrency,
  getThaiFiscalYear,
} from '../lib/thai-utils';

interface Props {
  staffList: StaffProfile[];
  editingClaim: MedicalClaim | null;
  onCancel: () => void;
  onSave: (payload: any, openPrintAfter: boolean) => Promise<void>;
  onGoToStaff: () => void;
}

export function ClaimForm7131Editor({
  staffList,
  editingClaim,
  onCancel,
  onSave,
  onGoToStaff,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [staffId, setStaffId] = useState<number>(
    editingClaim?.staffId || staffList[0]?.id || 0
  );
  const [claimDate, setClaimDate] = useState(editingClaim?.claimDate || todayStr);
  const [claimantName, setClaimantName] = useState(editingClaim?.claimantName || '');
  const [claimantPosition, setClaimantPosition] = useState(
    editingClaim?.claimantPosition || ''
  );
  const [claimantAffiliation, setClaimantAffiliation] = useState(
    editingClaim?.claimantAffiliation || 'สำนักงานสาธารณสุขอำเภอดอนพุด'
  );

  const [patientType, setPatientType] = useState<string>(
    editingClaim?.patientType || 'self'
  );
  const [patientName, setPatientName] = useState(editingClaim?.patientName || '');
  const [patientNationalId, setPatientNationalId] = useState(
    editingClaim?.patientNationalId || ''
  );
  const [childBirthDate, setChildBirthDate] = useState(
    editingClaim?.childBirthDate || ''
  );
  const [childOrder, setChildOrder] = useState<string>(
    editingClaim?.childOrder ? String(editingClaim.childOrder) : ''
  );
  const [isMinor, setIsMinor] = useState(Boolean(editingClaim?.isMinor));
  const [isIncapacitated, setIsIncapacitated] = useState(
    Boolean(editingClaim?.isIncapacitated)
  );

  const [diagnosis, setDiagnosis] = useState(editingClaim?.diagnosis || '');
  const [hospitalName, setHospitalName] = useState(editingClaim?.hospitalName || '');
  const [hospitalType, setHospitalType] = useState<string>(
    editingClaim?.hospitalType || 'public'
  );
  const [treatmentStartDate, setTreatmentStartDate] = useState(
    editingClaim?.treatmentStartDate || todayStr
  );
  const [treatmentEndDate, setTreatmentEndDate] = useState(
    editingClaim?.treatmentEndDate || todayStr
  );

  const [receipts, setReceipts] = useState<ClaimReceipt[]>(
    editingClaim?.receipts?.length
      ? editingClaim.receipts
      : [
          {
            receiptNumber: '',
            receiptDate: todayStr,
            category: EXPENSE_CATEGORIES[0],
            description: '',
            amount: '',
          },
        ]
  );

  const [entitlementBasis, setEntitlementBasis] = useState<string>(
    editingClaim?.entitlementBasis || 'full'
  );
  const [customClaimableAmount, setCustomClaimableAmount] = useState<string>(
    editingClaim ? String(editingClaim.claimableAmount) : ''
  );
  const [selfRightsOption, setSelfRightsOption] = useState<string>(
    editingClaim?.selfRightsOption || 'none'
  );
  const [relatedPersonRole, setRelatedPersonRole] = useState(
    editingClaim?.relatedPersonRole || ''
  );
  const [relatedRightsOption, setRelatedRightsOption] = useState<string>(
    editingClaim?.relatedRightsOption || ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === staffId) || null,
    [staffList, staffId]
  );

  // Auto-populate Section 1 when selecting staff for a new claim
  useEffect(() => {
    if (!editingClaim && selectedStaff) {
      setClaimantName(`${selectedStaff.prefix}${selectedStaff.fullName}`);
      setClaimantPosition(selectedStaff.position);
      setClaimantAffiliation(selectedStaff.affiliation);
    }
  }, [selectedStaff, editingClaim]);

  const totalAmount = useMemo(() => {
    return receipts.reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);
  }, [receipts]);

  const effectiveClaimableAmount = useMemo(() => {
    if (entitlementBasis === 'full') return totalAmount;
    const parsed = parseFloat(customClaimableAmount);
    return Number.isNaN(parsed) ? totalAmount : parsed;
  }, [entitlementBasis, totalAmount, customClaimableAmount]);

  const applyDependent = (dep: StaffDependent) => {
    setPatientType(dep.relationship);
    setPatientName(dep.fullName);
    setPatientNationalId(dep.nationalId);
    setChildBirthDate(dep.birthDate || '');
    setChildOrder(dep.childOrder ? String(dep.childOrder) : '');
    setIsMinor(Boolean(dep.isMinor));
    setIsIncapacitated(Boolean(dep.isIncapacitated));
    if (dep.relationship !== 'child') {
      setRelatedPersonRole(PATIENT_TYPE_LABELS[dep.relationship] || '');
      if (!relatedRightsOption) setRelatedRightsOption('none');
    } else {
      setRelatedPersonRole('คู่สมรส');
      if (!relatedRightsOption) setRelatedRightsOption('none');
    }
  };

  const addReceiptRow = () => {
    setReceipts((prev) => [
      ...prev,
      {
        receiptNumber: '',
        receiptDate: treatmentEndDate || todayStr,
        category: EXPENSE_CATEGORIES[0],
        description: '',
        amount: '',
      },
    ]);
  };

  const updateReceiptRow = (
    idx: number,
    field: keyof ClaimReceipt,
    value: string
  ) => {
    setReceipts((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const removeReceiptRow = (idx: number) => {
    setReceipts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const handleSubmit = async (status: 'draft' | 'submitted', openPrintAfter: boolean) => {
    setErrorMsg(null);
    if (!staffId) {
      setErrorMsg('กรุณาเลือกเจ้าหน้าที่ผู้ขอเบิกจากฐานข้อมูล');
      return;
    }
    if (!claimantName.trim() || !claimantPosition.trim()) {
      setErrorMsg('กรุณากรอกชื่อและตำแหน่งผู้ขอเบิกในส่วนที่ 1');
      return;
    }
    if (patientType !== 'self' && !patientName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุลผู้ป่วย');
      return;
    }
    if (!diagnosis.trim() || !hospitalName.trim()) {
      setErrorMsg('กรุณากรอกชื่อโรคและชื่อสถานพยาบาล');
      return;
    }
    const cleanReceipts = receipts
      .map((r) => ({
        receiptNumber: r.receiptNumber.trim() || '-',
        receiptDate: r.receiptDate || treatmentEndDate,
        category: r.category,
        description: r.description.trim() || r.category,
        amount: parseFloat(String(r.amount)) || 0,
      }))
      .filter((r) => r.amount > 0);

    if (cleanReceipts.length === 0) {
      setErrorMsg('กรุณากรอกรายการค่ารักษาพยาบาลอย่างน้อย 1 ใบเสร็จที่มีจำนวนเงินมากกว่า 0');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          staffId,
          claimDate,
          fiscalYear: getThaiFiscalYear(claimDate),
          claimantName,
          claimantPosition,
          claimantAffiliation,
          patientType,
          patientName: patientType === 'self' ? claimantName : patientName,
          patientNationalId:
            patientType === 'self'
              ? selectedStaff?.nationalId || ''
              : patientNationalId,
          childBirthDate: patientType === 'child' ? childBirthDate : '',
          childOrder:
            patientType === 'child' && childOrder ? parseInt(childOrder, 10) : null,
          isMinor: patientType === 'child' ? isMinor : false,
          isIncapacitated: patientType === 'child' ? isIncapacitated : false,
          diagnosis,
          hospitalName,
          hospitalType,
          treatmentStartDate,
          treatmentEndDate,
          entitlementBasis,
          claimableAmount: effectiveClaimableAmount,
          selfRightsOption,
          relatedPersonRole,
          relatedRightsOption,
          status,
          receipts: cleanReceipts,
        },
        openPrintAfter
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'ไม่สามารถบันทึกใบเบิกได้');
    } finally {
      setSubmitting(false);
    }
  };

  if (staffList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-xl mx-auto">
        <h3 className="text-base font-semibold text-slate-900 mb-2">
          ยังไม่มีรายชื่อเจ้าหน้าที่สาธารณสุขในฐานข้อมูล SQL
        </h3>
        <p className="text-xs text-slate-600 mb-5">
          กรุณาเพิ่มข้อมูลเจ้าหน้าที่สาธารณสุขอย่างน้อย 1 รายการก่อน เพื่อใช้ดึงชื่อ ตำแหน่ง และสิทธิครอบครัวลงในแบบ 7131 อัตโนมัติ
        </p>
        <button
          type="button"
          onClick={onGoToStaff}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg"
        >
          <UserCheck className="w-4 h-4" />
          ไปที่หน้าเพิ่มข้อมูลเจ้าหน้าที่
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {editingClaim
                ? `แก้ไขใบเบิกเงินสวัสดิการ แบบ 7131 (${editingClaim.claimNumber})`
                : 'บันทึกใบเบิกเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล (แบบ 7131)'}
            </h2>
            <p className="text-xs text-slate-500">
              ระบบดึงข้อมูลเจ้าหน้าที่และคำนวณจำนวนเงินตัวอักษรไทยอัตโนมัติ
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Section 1: Staff Selection & Claimant */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            ส่วนที่ 1 · ข้อมูลเจ้าหน้าที่สาธารณสุขผู้ขอเบิก
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>วันที่ยื่นใบเบิก:</span>
            <input
              type="date"
              value={claimDate}
              onChange={(e) => setClaimDate(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-md text-slate-800 bg-slate-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">
              เลือกเจ้าหน้าที่จากฐานข้อมูล SQL
            </label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-teal-600"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.staffCode}] {s.prefix}
                  {s.fullName} — {s.position} ({s.department || s.affiliation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">1. ข้าพเจ้า</label>
            <input
              type="text"
              value={claimantName}
              onChange={(e) => setClaimantName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">ตำแหน่ง</label>
            <input
              type="text"
              value={claimantPosition}
              onChange={(e) => setClaimantPosition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">สังกัด</label>
            <input
              type="text"
              value={claimantAffiliation}
              onChange={(e) => setClaimantAffiliation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Patient & Treatment */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            ส่วนที่ 2 · ขอเบิกเงินค่ารักษาพยาบาลของ และข้อมูลสถานพยาบาล
          </h3>
        </div>

        {/* Quick-fill from SQL Dependents */}
        {selectedStaff && selectedStaff.dependents.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="text-xs font-medium text-slate-700">
              ดึงข้อมูลบุคคลในครอบครัวที่บันทึกไว้ในฐานข้อมูล:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPatientType('self');
                  setPatientName('');
                  setPatientNationalId('');
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-600 rounded-md text-xs font-medium text-slate-700"
              >
                ตนเอง ({selectedStaff.prefix}
                {selectedStaff.fullName})
              </button>
              {selectedStaff.dependents.map((dep) => (
                <button
                  key={dep.id}
                  type="button"
                  onClick={() => applyDependent(dep)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-600 rounded-md text-xs font-medium text-slate-700"
                >
                  {PATIENT_TYPE_LABELS[dep.relationship]}: {dep.fullName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Patient Type Selector */}
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap gap-2">
            {(['self', 'spouse', 'father', 'mother', 'child'] as const).map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => {
                  setPatientType(pt);
                  if (pt === 'spouse' || pt === 'father' || pt === 'mother') {
                    setRelatedPersonRole(PATIENT_TYPE_LABELS[pt]);
                  }
                }}
                className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  patientType === pt
                    ? 'bg-teal-700 border-teal-700 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {PATIENT_TYPE_LABELS[pt]}
              </button>
            ))}
          </div>

          {patientType !== 'self' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุล ({PATIENT_TYPE_LABELS[patientType]})
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="ระบุชื่อ-นามสกุลผู้ป่วย"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  เลขประจำตัวประชาชน (13 หลัก)
                </label>
                <input
                  type="text"
                  maxLength={13}
                  value={patientNationalId}
                  onChange={(e) => setPatientNationalId(e.target.value.replace(/\D/g, ''))}
                  placeholder="1100000000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums focus:outline-none focus:border-teal-600"
                />
              </div>

              {patientType === 'child' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">เกิดเมื่อ</label>
                    <input
                      type="date"
                      value={childBirthDate}
                      onChange={(e) => setChildBirthDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      เป็นบุตรลำดับที่
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={childOrder}
                      onChange={(e) => setChildOrder(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-6 pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMinor}
                        onChange={(e) => setIsMinor(e.target.checked)}
                        className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                      />
                      <span>ยังไม่บรรลุนิติภาวะ</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isIncapacitated}
                        onChange={(e) => setIsIncapacitated(e.target.checked)}
                        className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                      />
                      <span>เป็นบุตรไร้ความสามารถ หรือเสมือนไร้ความสามารถ</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Diagnosis & Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">ป่วยเป็นโรค</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="เช่น ความดันโลหิตสูง, ไข้หวัดใหญ่, ผ่าตัดไส้ติ่ง"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ชื่อสถานพยาบาลที่ตรวจรักษา
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="เช่น โรงพยาบาลสระบุรี"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ประเภทสถานพยาบาล
              </label>
              <div className="flex gap-3 pt-1">
                <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="hospitalType"
                    checked={hospitalType === 'public'}
                    onChange={() => setHospitalType('public')}
                    className="text-teal-700"
                  />
                  <span>ทางราชการ</span>
                </label>
                <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="hospitalType"
                    checked={hospitalType === 'private'}
                    onChange={() => setHospitalType('private')}
                    className="text-teal-700"
                  />
                  <span>เอกชน</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">ตั้งแต่วันที่</label>
              <input
                type="date"
                value={treatmentStartDate}
                onChange={(e) => setTreatmentStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">ถึงวันที่</label>
              <input
                type="date"
                value={treatmentEndDate}
                onChange={(e) => setTreatmentEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Itemized Receipts Builder */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              รายการใบเสร็จรับเงินและค่ารักษาพยาบาลที่แนบ
            </h3>
            <p className="text-xs text-slate-500">
              ระบบจะรวมยอดเงิน นับจำนวนฉบับ และแปลงเป็นตัวอักษรภาษาไทยให้อัตโนมัติ
            </p>
          </div>
          <button
            type="button"
            onClick={addReceiptRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-700 text-teal-700 hover:bg-teal-50 text-xs font-medium rounded-lg whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มใบเสร็จ
          </button>
        </div>

        <div className="space-y-3">
          {receipts.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <div className="md:col-span-2">
                <label className="block font-medium text-slate-600 mb-1">เลขที่ใบเสร็จ</label>
                <input
                  type="text"
                  value={row.receiptNumber}
                  onChange={(e) => updateReceiptRow(idx, 'receiptNumber', e.target.value)}
                  placeholder="RC-001"
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-md font-mono-nums"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium text-slate-600 mb-1">วันที่ใบเสร็จ</label>
                <input
                  type="date"
                  value={row.receiptDate}
                  onChange={(e) => updateReceiptRow(idx, 'receiptDate', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-md"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block font-medium text-slate-600 mb-1">หมวดค่ารักษา</label>
                <select
                  value={row.category}
                  onChange={(e) => updateReceiptRow(idx, 'category', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-md"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block font-medium text-slate-600 mb-1">รายละเอียด</label>
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateReceiptRow(idx, 'description', e.target.value)}
                  placeholder="ระบุรายการรักษา/ยา"
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-md"
                />
              </div>
              <div className="md:col-span-2 flex items-end gap-1.5">
                <div className="flex-1">
                  <label className="block font-medium text-slate-600 mb-1">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.amount}
                    onChange={(e) => updateReceiptRow(idx, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-md text-right font-mono-nums font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeReceiptRow(idx)}
                  disabled={receipts.length === 1}
                  className="p-2 text-red-600 hover:bg-red-50 disabled:opacity-30 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Auto-calculated Total Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
          <div className="text-slate-600">
            จำนวนใบเสร็จที่แนบ:{' '}
            <span className="font-mono-nums font-semibold text-slate-900">
              {receipts.filter((r) => (parseFloat(String(r.amount)) || 0) > 0).length} ฉบับ
            </span>{' '}
            · ตัวอักษร: <span className="font-semibold text-slate-900">({bahtText(totalAmount)})</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono-nums">
            รวมเงินทั้งสิ้น: {formatCurrency(totalAmount)} บาท
          </div>
        </div>
      </section>

      {/* Section 3: Entitlement Declaration */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 text-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            ส่วนที่ 3 · การรับรองสิทธิการได้รับเงินค่ารักษาพยาบาลตามพระราชกฤษฎีกาฯ
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="font-medium text-slate-800">ขอรับเงินค่ารักษาพยาบาล:</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {[
              { key: 'full', label: 'ตามสิทธิ (เต็มจำนวนที่เบิกได้)' },
              {
                key: 'excess_other_agency',
                label: 'เฉพาะส่วนที่ขาดอยู่จากสิทธิที่ได้รับจากหน่วยงานอื่น',
              },
              {
                key: 'excess_insurance',
                label: 'เฉพาะส่วนที่ขาดอยู่จากสัญญาประกันภัย',
              },
            ].map((opt) => (
              <label
                key={opt.key}
                className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer ${
                  entitlementBasis === opt.key
                    ? 'border-teal-700 bg-teal-50/40'
                    : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="entitlementBasis"
                  checked={entitlementBasis === opt.key}
                  onChange={() => setEntitlementBasis(opt.key)}
                  className="mt-0.5 text-teal-700"
                />
                <span className="text-slate-800">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                เป็นเงินที่ขอเบิกได้จริง (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                value={
                  entitlementBasis === 'full'
                    ? totalAmount.toFixed(2)
                    : customClaimableAmount
                }
                disabled={entitlementBasis === 'full'}
                onChange={(e) => setCustomClaimableAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums font-semibold disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                จำนวนเงินตัวอักษร (อัตโนมัติ)
              </label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                {bahtText(effectiveClaimableAmount)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <div className="font-semibold text-slate-800">(1) ข้าพเจ้า</div>
            {[
              { key: 'none', label: 'ไม่มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่น' },
              {
                key: 'choose_gov',
                label: 'มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่นแต่เลือกใช้สิทธิจากทางราชการ',
              },
              {
                key: 'insurance',
                label: 'มีสิทธิได้รับค่ารักษาพยาบาลตามสัญญาประกันภัย',
              },
              {
                key: 'sole_child_claimant',
                label: 'เป็นผู้ใช้สิทธิเบิกค่ารักษาพยาบาลสำหรับบุตรแต่เพียงฝ่ายเดียว',
              },
            ].map((opt) => (
              <label key={opt.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="selfRightsOption"
                  checked={selfRightsOption === opt.key}
                  onChange={() => setSelfRightsOption(opt.key)}
                  className="mt-0.5 text-teal-700"
                />
                <span className="text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">(2)</span>
              <input
                type="text"
                value={relatedPersonRole}
                onChange={(e) => setRelatedPersonRole(e.target.value)}
                placeholder="เช่น คู่สมรส / บิดา / มารดา"
                className="px-2.5 py-1 border border-slate-200 rounded-md w-44 text-xs"
              />
              <span className="font-semibold text-slate-800">ข้าพเจ้า</span>
            </div>
            {[
              { key: '', label: 'ไม่ระบุ (กรณีเบิกตนเอง)' },
              { key: 'none', label: 'ไม่มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่น' },
              {
                key: 'lower_than_decree',
                label:
                  'มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่น แต่ค่ารักษาที่ได้รับต่ำกว่าสิทธิฯ',
              },
              {
                key: 'insurance',
                label: 'มีสิทธิได้รับค่ารักษาพยาบาลตามสัญญาประกันภัย',
              },
              {
                key: 'dependent_of_other',
                label: 'มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่นในฐานะผู้อาศัยสิทธิของผู้อื่น',
              },
            ].map((opt) => (
              <label key={opt.key || 'unset'} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="relatedRightsOption"
                  checked={relatedRightsOption === opt.key}
                  onChange={() => setRelatedRightsOption(opt.key)}
                  className="mt-0.5 text-teal-700"
                />
                <span className="text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit('draft', false)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 text-xs font-medium rounded-lg"
        >
          <Save className="w-3.5 h-3.5" />
          บันทึกฉบับร่าง
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit('submitted', true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-xs font-medium rounded-lg"
        >
          <Printer className="w-3.5 h-3.5" />
          {submitting ? 'กำลังบันทึก...' : 'บันทึกและออกใบเบิก แบบ 7131'}
        </button>
      </div>
    </div>
  );
}
