import React, { useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { StaffProfile } from '../types/medical';
import {
  PATIENT_TYPE_LABELS,
  formatCurrency,
  formatNationalId,
  formatThaiDate,
} from '../lib/thai-utils';

interface Props {
  staffList: StaffProfile[];
  onCreateStaff: (data: any) => Promise<void>;
  onUpdateStaff: (id: number, data: any) => Promise<void>;
  onDeleteStaff: (id: number) => Promise<void>;
  onAddDependent: (staffId: number, data: any) => Promise<void>;
  onDeleteDependent: (depId: number) => Promise<void>;
}

const EMPTY_STAFF_FORM = {
  staffCode: '',
  prefix: 'นางสาว',
  fullName: '',
  nationalId: '',
  position: '',
  affiliation: 'สำนักงานสาธารณสุขอำเภอดอนพุด',
  department: '',
  phone: '',
  bankName: 'ธนาคารกรุงไทย',
  bankAccount: '',
};

export function StaffDirectoryView({
  staffList,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAddDependent,
  onDeleteDependent,
}: Props) {
  const [search, setSearch] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [depStaff, setDepStaff] = useState<StaffProfile | null>(null);
  const [depForm, setDepForm] = useState({
    relationship: 'spouse',
    fullName: '',
    nationalId: '',
    birthDate: '',
    childOrder: '1',
    isMinor: true,
    isIncapacitated: false,
  });
  const [savingDep, setSavingDep] = useState(false);

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffList;
    const q = search.trim().toLowerCase();
    return staffList.filter((s) =>
      `${s.staffCode} ${s.prefix}${s.fullName} ${s.position} ${s.department} ${s.affiliation}`
        .toLowerCase()
        .includes(q)
    );
  }, [staffList, search]);

  const openCreateModal = () => {
    setEditingStaff(null);
    setStaffForm({
      ...EMPTY_STAFF_FORM,
      staffCode: `DP-${String(staffList.length + 1).padStart(4, '0')}`,
    });
    setStaffError(null);
    setShowStaffModal(true);
  };

  const openEditModal = (s: StaffProfile) => {
    setEditingStaff(s);
    setStaffForm({
      staffCode: s.staffCode,
      prefix: s.prefix,
      fullName: s.fullName,
      nationalId: s.nationalId,
      position: s.position,
      affiliation: s.affiliation,
      department: s.department,
      phone: s.phone || '',
      bankName: s.bankName || '',
      bankAccount: s.bankAccount || '',
    });
    setStaffError(null);
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setSavingStaff(true);
    try {
      if (editingStaff) {
        await onUpdateStaff(editingStaff.id, staffForm);
      } else {
        await onCreateStaff(staffForm);
      }
      setShowStaffModal(false);
    } catch (err: any) {
      setStaffError(err?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleAddDependentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depStaff) return;
    setSavingDep(true);
    try {
      await onAddDependent(depStaff.id, {
        ...depForm,
        childOrder:
          depForm.relationship === 'child' ? parseInt(depForm.childOrder, 10) || 1 : null,
      });
      setDepForm({
        relationship: 'spouse',
        fullName: '',
        nationalId: '',
        birthDate: '',
        childOrder: '1',
        isMinor: true,
        isIncapacitated: false,
      });
      setDepStaff(null);
    } finally {
      setSavingDep(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            ฐานข้อมูลเจ้าหน้าที่สาธารณสุขและบุคคลในครอบครัวผู้มีสิทธิ
          </h2>
          <p className="text-xs text-slate-500">
            จัดเก็บข้อมูลข้าราชการ/เจ้าหน้าที่สาธารณสุขเพื่อเชื่อมโยงกับใบเบิก แบบ 7131 และ แบบ 7223 อัตโนมัติ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[230px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง, กลุ่มงาน..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มเจ้าหน้าที่ใหม่
          </button>
        </div>
      </div>

      {/* Staff Cards / Table */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-800 mb-1">
            ยังไม่มีข้อมูลเจ้าหน้าที่สาธารณสุข
          </p>
          <p className="text-xs text-slate-500 mb-4">
            เพิ่มประวัติเจ้าหน้าที่สาธารณสุขเพื่อเริ่มต้นบันทึกใบเบิกค่ารักษาพยาบาล
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มเจ้าหน้าที่คนแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredStaff.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-nums text-xs font-semibold text-teal-700">
                      {s.staffCode}
                    </span>
                    <span className="text-slate-300">·</span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {s.prefix}
                      {s.fullName}
                    </h3>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500 font-mono-nums">
                      บัตร ปชช. {formatNationalId(s.nationalId)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {s.position} · {s.department ? `${s.department} · ` : ''}
                    {s.affiliation}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                    {s.phone && <span>โทร: {s.phone}</span>}
                    {s.bankAccount && (
                      <span className="font-mono-nums">
                        บัญชีรับเงิน: {s.bankName} {s.bankAccount}
                      </span>
                    )}
                    <span className="font-mono-nums">
                      รักษาพยาบาล (7131): {s.claimCount ?? 0} ฉบับ ({formatCurrency(s.totalClaimed)} บ.) · การศึกษาบุตร (7223): {s.educationClaimCount ?? 0} ฉบับ ({formatCurrency(s.totalEducationClaimed)} บ.)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDepStaff(s)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-teal-600 hover:text-teal-700 rounded-lg text-xs font-medium text-slate-700"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    เพิ่มบุคคลในครอบครัว
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(s)}
                    className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                    title="แก้ไข"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(`ยืนยันการลบข้อมูลเจ้าหน้าที่ ${s.prefix}${s.fullName} หรือไม่?`)
                      ) {
                        onDeleteStaff(s.id);
                      }
                    }}
                    className="p-1.5 border border-slate-200 hover:bg-red-50 rounded-lg text-red-600"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dependents Table */}
              {s.dependents.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-medium text-slate-600 mb-2">
                    รายชื่อบุคคลในครอบครัวที่มีสิทธิเบิกค่ารักษาพยาบาล ({s.dependents.length} คน)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">ความสัมพันธ์</th>
                          <th className="px-3 py-2 text-left font-medium">ชื่อ-นามสกุล</th>
                          <th className="px-3 py-2 text-left font-medium">เลขประจำตัวประชาชน</th>
                          <th className="px-3 py-2 text-left font-medium">รายละเอียดเพิ่มเติม</th>
                          <th className="px-3 py-2 text-right font-medium">ลบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {s.dependents.map((d) => (
                          <tr key={d.id}>
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {PATIENT_TYPE_LABELS[d.relationship] || d.relationship}
                            </td>
                            <td className="px-3 py-2 text-slate-900">{d.fullName}</td>
                            <td className="px-3 py-2 font-mono-nums text-slate-600">
                              {formatNationalId(d.nationalId)}
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {d.relationship === 'child'
                                ? `เกิด ${formatThaiDate(d.birthDate, true)} · ลำดับที่ ${d.childOrder ?? '-'}${d.isMinor ? ' · ยังไม่บรรลุนิติภาวะ' : ''}`
                                : '-'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteDependent(d.id)}
                                className="text-red-600 hover:underline"
                              >
                                ลบ
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingStaff ? 'แก้ไขข้อมูลเจ้าหน้าที่สาธารณสุข' : 'เพิ่มเจ้าหน้าที่สาธารณสุขใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-5 space-y-4 text-xs">
              {staffError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
                  {staffError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">รหัสเจ้าหน้าที่ *</label>
                  <input
                    required
                    type="text"
                    value={staffForm.staffCode}
                    onChange={(e) =>
                      setStaffForm((f) => ({ ...f, staffCode: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">คำนำหน้า</label>
                  <input
                    type="text"
                    value={staffForm.prefix}
                    onChange={(e) => setStaffForm((f) => ({ ...f, prefix: e.target.value }))}
                    placeholder="นาย / นาง / นางสาว / นพ."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    เลขบัตรประชาชน (13 หลัก) *
                  </label>
                  <input
                    required
                    maxLength={13}
                    type="text"
                    value={staffForm.nationalId}
                    onChange={(e) =>
                      setStaffForm((f) => ({
                        ...f,
                        nationalId: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
                  <input
                    required
                    type="text"
                    value={staffForm.fullName}
                    onChange={(e) =>
                      setStaffForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ตำแหน่ง *</label>
                  <input
                    required
                    type="text"
                    value={staffForm.position}
                    onChange={(e) =>
                      setStaffForm((f) => ({ ...f, position: e.target.value }))
                    }
                    placeholder="เช่น นักวิชาการสาธารณสุขชำนาญการ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">สังกัด *</label>
                  <input
                    required
                    type="text"
                    value={staffForm.affiliation}
                    onChange={(e) =>
                      setStaffForm((f) => ({ ...f, affiliation: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    กลุ่มงาน / หน่วยงานย่อย
                  </label>
                  <input
                    type="text"
                    value={staffForm.department}
                    onChange={(e) =>
                      setStaffForm((f) => ({ ...f, department: e.target.value }))
                    }
                    placeholder="เช่น กลุ่มงานควบคุมโรค / รพ.สต."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ธนาคาร</label>
                  <input
                    type="text"
                    value={staffForm.bankName}
                    onChange={(e) =>
                      setStaffForm((f) => ({ ...f, bankName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เลขที่บัญชี</label>
                  <input
                    type="text"
                    value={staffForm.bankAccount}
                    onChange={(e) =>
                      setStaffForm((f) => ({ ...f, bankAccount: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white rounded-lg font-medium"
                >
                  {savingStaff ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเจ้าหน้าที่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dependent Modal */}
      {depStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  เพิ่มบุคคลในครอบครัวที่มีสิทธิ
                </h3>
                <p className="text-xs text-slate-500">
                  เจ้าหน้าที่: {depStaff.prefix}
                  {depStaff.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDepStaff(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddDependentSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">ความสัมพันธ์</label>
                <select
                  value={depForm.relationship}
                  onChange={(e) =>
                    setDepForm((f) => ({ ...f, relationship: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="spouse">คู่สมรส</option>
                  <option value="father">บิดา</option>
                  <option value="mother">มารดา</option>
                  <option value="child">บุตร</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
                <input
                  required
                  type="text"
                  value={depForm.fullName}
                  onChange={(e) =>
                    setDepForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  เลขประจำตัวประชาชน (13 หลัก) *
                </label>
                <input
                  required
                  maxLength={13}
                  type="text"
                  value={depForm.nationalId}
                  onChange={(e) =>
                    setDepForm((f) => ({
                      ...f,
                      nationalId: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums"
                />
              </div>
              {depForm.relationship === 'child' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">วันเกิด</label>
                      <input
                        type="date"
                        value={depForm.birthDate}
                        onChange={(e) =>
                          setDepForm((f) => ({ ...f, birthDate: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        บุตรลำดับที่
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={depForm.childOrder}
                        onChange={(e) =>
                          setDepForm((f) => ({ ...f, childOrder: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono-nums"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={depForm.isMinor}
                        onChange={(e) =>
                          setDepForm((f) => ({ ...f, isMinor: e.target.checked }))
                        }
                      />
                      <span>ยังไม่บรรลุนิติภาวะ</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={depForm.isIncapacitated}
                        onChange={(e) =>
                          setDepForm((f) => ({ ...f, isIncapacitated: e.target.checked }))
                        }
                      />
                      <span>เป็นบุตรไร้ความสามารถ หรือเสมือนไร้ความสามารถ</span>
                    </label>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepStaff(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingDep}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white rounded-lg font-medium"
                >
                  {savingDep ? 'กำลังบันทึก...' : 'เพิ่มรายชื่อ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
