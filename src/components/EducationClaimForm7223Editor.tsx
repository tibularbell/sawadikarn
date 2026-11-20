import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Printer, Save, Trash2, UserCheck } from 'lucide-react';
import {
  EducationClaim,
  EducationClaimChild,
  StaffDependent,
  StaffProfile,
} from '../types/medical';
import {
  EDUCATION_LEVEL_PRESETS,
  bahtText,
  formatCurrency,
  getThaiFiscalYear,
} from '../lib/thai-utils';

interface Props {
  staffList: StaffProfile[];
  editingClaim: EducationClaim | null;
  onCancel: () => void;
  onSave: (payload: any, openPrintAfter: boolean) => Promise<void>;
  onGoToStaff: () => void;
}

const emptyChildRow = (idx: number): EducationClaimChild => ({
  dependentId: null,
  childOrderIndex: idx,
  childName: '',
  childBirthDate: '',
  fatherChildOrder: idx,
  motherChildOrder: idx,
  replacingDeceasedOrder: null,
  deceasedChildName: '',
  deceasedChildBirthDate: '',
  deceasedChildDeathDate: '',
  schoolName: '',
  schoolDistrict: 'ดอนพุด',
  schoolProvince: 'สระบุรี',
  gradeLevel: 'ประถมศึกษาปีที่ 1',
  isMaintenanceFee: true,
  isTuitionFee: false,
  amount: '',
  receiptNumber: '',
  receiptDate: new Date().toISOString().slice(0, 10),
});

export function EducationClaimForm7223Editor({
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
  const [academicYear, setAcademicYear] = useState(
    editingClaim?.academicYear || getThaiFiscalYear(todayStr)
  );
  const [semester, setSemester] = useState(editingClaim?.semester || '2');

  // Section 1
  const [claimantName, setClaimantName] = useState(editingClaim?.claimantName || '');
  const [claimantPosition, setClaimantPosition] = useState(
    editingClaim?.claimantPosition || ''
  );
  const [claimantAffiliation, setClaimantAffiliation] = useState(
    editingClaim?.claimantAffiliation || 'สำนักงานสาธารณสุขอำเภอดอนพุด'
  );

  // Section 2
  const [spouseName, setSpouseName] = useState(editingClaim?.spouseName || '');
  const [spouseStatus, setSpouseStatus] = useState<string>(
    editingClaim?.spouseStatus || 'not_gov'
  );
  const [spousePosition, setSpousePosition] = useState(
    editingClaim?.spousePosition || ''
  );
  const [spouseAffiliation, setSpouseAffiliation] = useState(
    editingClaim?.spouseAffiliation || ''
  );

  // Section 3
  const [claimantRole, setClaimantRole] = useState<string>(
    editingClaim?.claimantRole || 'lawful_father'
  );

  // Section 4 Children
  const [children, setChildren] = useState<EducationClaimChild[]>(
    editingClaim?.children?.length
      ? editingClaim.children
      : [emptyChildRow(1)]
  );

  // Section 5 & 6
  const [entitlementBasis, setEntitlementBasis] = useState<string>(
    editingClaim?.entitlementBasis || 'full'
  );
  const [customClaimableAmount, setCustomClaimableAmount] = useState<string>(
    editingClaim ? String(editingClaim.claimableAmount) : ''
  );
  const [certHasRight, setCertHasRight] = useState(
    editingClaim ? editingClaim.certHasRight : true
  );
  const [certChildEligible, setCertChildEligible] = useState(
    editingClaim ? editingClaim.certChildEligible : true
  );
  const [certSoleClaimant, setCertSoleClaimant] = useState(
    editingClaim ? editingClaim.certSoleClaimant : false
  );
  const [certSpouseLowerBenefit, setCertSpouseLowerBenefit] = useState(
    editingClaim ? editingClaim.certSpouseLowerBenefit : false
  );
  const [spouseLowerAmount, setSpouseLowerAmount] = useState<string>(
    editingClaim?.spouseLowerAmount ? String(editingClaim.spouseLowerAmount) : ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === staffId) || null,
    [staffList, staffId]
  );

  // Auto-populate Section 1 & spouse when selecting staff on new claim
  useEffect(() => {
    if (!editingClaim && selectedStaff) {
      setClaimantName(`${selectedStaff.prefix}${selectedStaff.fullName}`);
      setClaimantPosition(selectedStaff.position);
      setClaimantAffiliation(selectedStaff.affiliation);

      const spouseDep = selectedStaff.dependents.find(
        (d) => d.relationship === 'spouse'
      );
      if (spouseDep) {
        setSpouseName(spouseDep.fullName);
      } else {
        setSpouseName('');
      }
    }
  }, [selectedStaff, editingClaim]);

  const savedChildrenDependents = useMemo(
    () =>
      (selectedStaff?.dependents || []).filter((d) => d.relationship === 'child'),
    [selectedStaff]
  );

  const totalAmount = useMemo(() => {
    return children.reduce((sum, ch) => sum + (parseFloat(String(ch.amount)) || 0), 0);
  }, [children]);

  const effectiveClaimableAmount = useMemo(() => {
    if (entitlementBasis === 'full') return totalAmount;
    const parsed = parseFloat(customClaimableAmount);
    return Number.isNaN(parsed) ? totalAmount : parsed;
  }, [entitlementBasis, totalAmount, customClaimableAmount]);

  const fillChildFromDependent = (dep: StaffDependent) => {
    setChildren((prev) => {
      const emptyIdx = prev.findIndex((c) => !c.childName.trim());
      const newEntry: EducationClaimChild = {
        ...emptyChildRow(emptyIdx >= 0 ? emptyIdx + 1 : prev.length + 1),
        dependentId: dep.id,
        childName: dep.fullName,
        childBirthDate: dep.birthDate || '',
        fatherChildOrder: dep.childOrder || 1,
        motherChildOrder: dep.childOrder || 1,
      };
      if (emptyIdx >= 0) {
        return prev.map((row, i) => (i === emptyIdx ? newEntry : row));
      }
      return [...prev, newEntry];
    });
  };

  const updateChildField = <K extends keyof EducationClaimChild>(
    idx: number,
    field: K,
    value: EducationClaimChild[K]
  ) => {
    setChildren((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const addChildRow = () => {
    setChildren((prev) => [...prev, emptyChildRow(prev.length + 1)]);
  };

  const removeChildRow = (idx: number) => {
    setChildren((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
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
    const validChildren = children
      .map((ch, idx) => ({
        ...ch,
        childOrderIndex: idx + 1,
        amount: parseFloat(String(ch.amount)) || 0,
      }))
      .filter((ch) => ch.childName.trim() && ch.schoolName.trim() && ch.amount > 0);

    if (validChildren.length === 0) {
      setErrorMsg('กรุณากรอกข้อมูลบุตร ชื่อสถานศึกษา และจำนวนเงินที่ขอเบิกอย่างน้อย 1 คน');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          staffId,
          claimDate,
          fiscalYear: getThaiFiscalYear(claimDate),
          academicYear,
          semester,
          claimantName,
          claimantPosition,
          claimantAffiliation,
          spouseName,
          spouseStatus,
          spousePosition,
          spouseAffiliation,
          claimantRole,
          entitlementBasis,
          claimableAmount: effectiveClaimableAmount,
          certHasRight,
          certChildEligible,
          certSoleClaimant,
          certSpouseLowerBenefit,
          spouseLowerAmount: parseFloat(spouseLowerAmount) || 0,
          status,
          children: validChildren,
        },
        openPrintAfter
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'ไม่สามารถบันทึกใบเบิกแบบ 7223 ได้');
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
          กรุณาเพิ่มข้อมูลเจ้าหน้าที่และข้อมูลบุตรในฐานข้อมูลก่อน เพื่อดึงรายชื่อลงแบบ 7223 อัตโนมัติ
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
              ? `แก้ไขใบเบิกเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร แบบ 7223 (${editingClaim.claimNumber})`
              : 'บันทึกใบเบิกเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร (แบบ 7223)'}
          </h2>
          <p className="text-xs text-slate-500">
            ดึงข้อมูลเจ้าหน้าที่ คู่สมรส และบุตรจากฐานข้อมูล SQL · คำนวณยอดเงินและตัวอักษรภาษาไทยอัตโนมัติ
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Section 1 */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            ส่วนที่ 1 · ข้อมูลเจ้าหน้าที่ผู้ขอเบิก
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-600">
              <span>ปีการศึกษา:</span>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-20 px-2 py-1 border border-slate-200 rounded-md font-mono-nums bg-slate-50"
              />
            </label>
            <label className="flex items-center gap-1.5 text-slate-600">
              <span>ภาคเรียนที่:</span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-md bg-slate-50"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="ตลอดปีการศึกษา">ตลอดปีการศึกษา</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-slate-600">
              <span>วันที่ยื่น:</span>
              <input
                type="date"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-md bg-slate-50"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">
              เลือกเจ้าหน้าที่จากฐานข้อมูล SQL
            </label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">ตำแหน่ง</label>
            <input
              type="text"
              value={claimantPosition}
              onChange={(e) => setClaimantPosition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">สังกัด</label>
            <input
              type="text"
              value={claimantAffiliation}
              onChange={(e) => setClaimantAffiliation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Section 2 & 3: Spouse & Claimant Legal Role */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 text-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            ส่วนที่ 2 และ 3 · ข้อมูลคู่สมรสและสถานะผู้ใช้สิทธิ
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              2. คู่สมรสของข้าพเจ้าชื่อ
            </label>
            <input
              type="text"
              value={spouseName}
              onChange={(e) => setSpouseName(e.target.value)}
              placeholder="ระบุชื่อ-นามสกุลคู่สมรส (ถ้ามี)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-slate-700">สถานภาพการทำงานของคู่สมรส</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'not_gov', label: 'ไม่เป็นข้าราชการหรือลูกจ้างประจำ' },
                { key: 'gov_officer', label: 'เป็นข้าราชการ' },
                { key: 'permanent_employee', label: 'เป็นลูกจ้างประจำ' },
                {
                  key: 'state_enterprise_or_other',
                  label: 'เป็นพนักงาน/ลูกจ้างรัฐวิสาหกิจ อปท. องค์การมหาชน หรือหน่วยงานอื่น',
                },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer ${
                    spouseStatus === opt.key
                      ? 'border-teal-700 bg-teal-50/40'
                      : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="spouseStatus"
                    checked={spouseStatus === opt.key}
                    onChange={() => setSpouseStatus(opt.key)}
                    className="mt-0.5 text-teal-700"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {spouseStatus !== 'not_gov' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ตำแหน่งของคู่สมรส
                </label>
                <input
                  type="text"
                  value={spousePosition}
                  onChange={(e) => setSpousePosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  สังกัดของคู่สมรส
                </label>
                <input
                  type="text"
                  value={spouseAffiliation}
                  onChange={(e) => setSpouseAffiliation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="font-medium text-slate-700">
            3. ข้าพเจ้าเป็นผู้มีสิทธิและขอใช้สิทธิเนื่องจาก
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'lawful_father', label: 'เป็นบิดาชอบด้วยกฎหมาย' },
              { key: 'mother', label: 'เป็นมารดา' },
            ].map((role) => (
              <label
                key={role.key}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer ${
                  claimantRole === role.key
                    ? 'border-teal-700 bg-teal-50/40 font-medium'
                    : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="claimantRole"
                  checked={claimantRole === role.key}
                  onChange={() => setClaimantRole(role.key)}
                  className="text-teal-700"
                />
                <span>{role.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Children & School Fees */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              ส่วนที่ 4 · รายการบุตร สถานศึกษา และค่าการศึกษาที่ขอเบิก
            </h3>
            <p className="text-xs text-slate-500">
              บันทึกข้อมูลบุตร (1) เงินบำรุงการศึกษา และ/หรือ (2) เงินค่าเล่าเรียน แยกรายบุคคล
            </p>
          </div>
          <button
            type="button"
            onClick={addChildRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-700 text-teal-700 hover:bg-teal-50 font-medium rounded-lg whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มรายการบุตร
          </button>
        </div>

        {/* Quick-add saved child dependents */}
        {savedChildrenDependents.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="font-medium text-slate-700">
              ดึงข้อมูลบุตรจากฐานข้อมูล SQL ของเจ้าหน้าที่:
            </div>
            <div className="flex flex-wrap gap-2">
              {savedChildrenDependents.map((dep) => (
                <button
                  key={dep.id}
                  type="button"
                  onClick={() => fillChildFromDependent(dep)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-600 rounded-md font-medium text-slate-700"
                >
                  + {dep.fullName} (บุตรลำดับที่ {dep.childOrder ?? '-'})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {children.map((ch, idx) => (
            <div
              key={idx}
              className="border border-slate-200 bg-slate-50/70 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  บุตรคนที่ {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeChildRow(idx)}
                  disabled={children.length === 1}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบรายการ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    ชื่อ-นามสกุลบุตร *
                  </label>
                  <input
                    type="text"
                    value={ch.childName}
                    onChange={(e) => updateChildField(idx, 'childName', e.target.value)}
                    placeholder="เช่น เด็กชายภูมิพัฒน์ ศรีประเสริฐ"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เกิดเมื่อ</label>
                  <input
                    type="date"
                    value={ch.childBirthDate || ''}
                    onChange={(e) =>
                      updateChildField(idx, 'childBirthDate', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ลำดับ (บิดา)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={ch.fatherChildOrder ?? ''}
                      onChange={(e) =>
                        updateChildField(
                          idx,
                          'fatherChildOrder',
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg font-mono-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ลำดับ (มารดา)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={ch.motherChildOrder ?? ''}
                      onChange={(e) =>
                        updateChildField(
                          idx,
                          'motherChildOrder',
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg font-mono-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    สถานศึกษา *
                  </label>
                  <input
                    type="text"
                    value={ch.schoolName}
                    onChange={(e) => updateChildField(idx, 'schoolName', e.target.value)}
                    placeholder="เช่น โรงเรียนอนุบาลดอนพุด"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">อำเภอ</label>
                  <input
                    type="text"
                    value={ch.schoolDistrict || ''}
                    onChange={(e) =>
                      updateChildField(idx, 'schoolDistrict', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">จังหวัด</label>
                  <input
                    type="text"
                    value={ch.schoolProvince || ''}
                    onChange={(e) =>
                      updateChildField(idx, 'schoolProvince', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="block font-medium text-slate-700 mb-1">
                    ชั้นที่ศึกษา *
                  </label>
                  <input
                    list={`grade-presets-${idx}`}
                    type="text"
                    value={ch.gradeLevel}
                    onChange={(e) => updateChildField(idx, 'gradeLevel', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                  <datalist id={`grade-presets-${idx}`}>
                    {EDUCATION_LEVEL_PRESETS.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>

                <div className="md:col-span-3 flex flex-col gap-1.5 pb-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ch.isMaintenanceFee}
                      onChange={(e) =>
                        updateChildField(idx, 'isMaintenanceFee', e.target.checked)
                      }
                    />
                    <span>(1) เงินบำรุงการศึกษา</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ch.isTuitionFee}
                      onChange={(e) =>
                        updateChildField(idx, 'isTuitionFee', e.target.checked)
                      }
                    />
                    <span>(2) เงินค่าเล่าเรียน</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    เลขที่ใบเสร็จ
                  </label>
                  <input
                    type="text"
                    value={ch.receiptNumber || ''}
                    onChange={(e) =>
                      updateChildField(idx, 'receiptNumber', e.target.value)
                    }
                    placeholder="EDU-001"
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg font-mono-nums"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    วันที่ใบเสร็จ
                  </label>
                  <input
                    type="date"
                    value={ch.receiptDate || ''}
                    onChange={(e) => updateChildField(idx, 'receiptDate', e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    จำนวนเงิน (บาท) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ch.amount}
                    onChange={(e) => updateChildField(idx, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-right font-mono-nums font-semibold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <div className="text-slate-600">
            จำนวนบุตรที่ขอเบิก: <span className="font-mono-nums font-semibold">{children.length} คน</span> ·{' '}
            ตัวอักษร: <span className="font-semibold text-slate-900">({bahtText(totalAmount)})</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono-nums">
            รวมเงินทั้งสิ้น: {formatCurrency(totalAmount)} บาท
          </div>
        </div>
      </section>

      {/* Section 5 & 6 */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 text-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            ส่วนที่ 5 และ 6 · การรับเงินสวัสดิการและคำรับรองสิทธิ
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
              entitlementBasis === 'full'
                ? 'border-teal-700 bg-teal-50/40'
                : 'border-slate-200'
            }`}
          >
            <input
              type="radio"
              name="eduEntitlement"
              checked={entitlementBasis === 'full'}
              onChange={() => setEntitlementBasis('full')}
            />
            <span>ขอรับเงินสวัสดิการฯ ตามสิทธิ (เต็มจำนวนที่จ่ายจริง)</span>
          </label>
          <label
            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
              entitlementBasis === 'partial'
                ? 'border-teal-700 bg-teal-50/40'
                : 'border-slate-200'
            }`}
          >
            <input
              type="radio"
              name="eduEntitlement"
              checked={entitlementBasis === 'partial'}
              onChange={() => setEntitlementBasis('partial')}
            />
            <span>เฉพาะส่วนที่ยังขาดจากสิทธิ</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              จำนวนเงินที่มีสิทธิเบิกได้ (บาท)
            </label>
            <input
              type="number"
              step="0.01"
              disabled={entitlementBasis === 'full'}
              value={
                entitlementBasis === 'full'
                  ? totalAmount.toFixed(2)
                  : customClaimableAmount
              }
              onChange={(e) => setCustomClaimableAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums font-semibold disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              จำนวนเงินตัวอักษร
            </label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
              {bahtText(effectiveClaimableAmount)}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <div className="font-semibold text-slate-800">
            6. คำรับรองสิทธิตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={certHasRight}
              onChange={(e) => setCertHasRight(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              ข้าพเจ้ามีสิทธิได้รับเงินช่วยเหลือตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร และข้อความที่ระบุข้างต้นเป็นความจริง
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={certChildEligible}
              onChange={(e) => setCertChildEligible(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              บุตรของข้าพเจ้าอยู่ในข่ายได้รับความช่วยเหลือตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={certSoleClaimant}
              onChange={(e) => setCertSoleClaimant(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              เป็นผู้ใช้สิทธิเบิกเงินช่วยเหลือตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการศึกษาของบุตรแต่เพียงฝ่ายเดียว
            </span>
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={certSpouseLowerBenefit}
                onChange={(e) => setCertSpouseLowerBenefit(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                คู่สมรสของข้าพเจ้าได้รับการช่วยเหลือจากหน่วยงานอื่นต่ำกว่าจำนวนที่ได้รับจากทางราชการ
              </span>
            </label>
            {certSpouseLowerBenefit && (
              <div className="pl-6 flex items-center gap-2">
                <span>จำนวนส่วนต่าง (บาท):</span>
                <input
                  type="number"
                  step="0.01"
                  value={spouseLowerAmount}
                  onChange={(e) => setSpouseLowerAmount(e.target.value)}
                  className="w-40 px-2.5 py-1.5 border border-slate-200 rounded-md font-mono-nums"
                />
              </div>
            )}
          </div>
        </div>
      </section>

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
          {submitting ? 'กำลังบันทึก...' : 'บันทึกและออกใบเบิก แบบ 7223'}
        </button>
      </div>
    </div>
  );
}
