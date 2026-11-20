import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Edit3,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { EducationClaim } from '../types/medical';
import {
  CLAIM_STATUS_LABELS,
  formatCurrency,
  formatThaiDate,
} from '../lib/thai-utils';
import { StatusText } from './DashboardReportsView';

interface Props {
  claims: EducationClaim[];
  onCreateNew: () => void;
  onEditClaim: (claim: EducationClaim) => void;
  onPrintClaim: (claim: EducationClaim) => void;
  onDeleteClaim: (claimId: number) => Promise<void>;
  onUpdateStatus: (
    claimId: number,
    payload: {
      status: string;
      approverName: string;
      approverPosition: string;
      approvedDate: string;
      notes: string;
    }
  ) => Promise<void>;
}

const FILTER_TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'submitted', label: 'รอตรวจสอบ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'paid', label: 'เบิกจ่ายแล้ว' },
  { key: 'draft', label: 'ฉบับร่าง' },
];

export function EducationClaimsRegistryView({
  claims,
  onCreateNew,
  onEditClaim,
  onPrintClaim,
  onDeleteClaim,
  onUpdateStatus,
}: Props) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [approvingClaim, setApprovingClaim] = useState<EducationClaim | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    status: 'approved',
    approverName: '',
    approverPosition: '',
    approvedDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [savingStatus, setSavingStatus] = useState(false);

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const childrenText = c.children
          .map((ch) => `${ch.childName} ${ch.schoolName} ${ch.gradeLevel}`)
          .join(' ');
        const hay = `${c.claimNumber} ${c.claimantName} ${c.spouseName || ''} ${childrenText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [claims, statusFilter, search]);

  const openApprovalModal = (claim: EducationClaim) => {
    setApprovingClaim(claim);
    setApprovalForm({
      status: claim.status === 'submitted' ? 'approved' : claim.status,
      approverName: claim.approverName || 'นายแพทย์สาธารณสุขจังหวัดสระบุรี',
      approverPosition: claim.approverPosition || 'ผู้มีอำนาจอนุมัติเบิกจ่าย',
      approvedDate: claim.approvedDate || new Date().toISOString().slice(0, 10),
      notes: claim.notes || '',
    });
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingClaim) return;
    setSavingStatus(true);
    try {
      await onUpdateStatus(approvingClaim.id, approvalForm);
      setApprovingClaim(null);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[230px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเลขที่, ชื่อผู้เบิก, ชื่อบุตร, สถานศึกษา..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              สร้างใบเบิก 7223
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredClaims.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-800 mb-1">
              ไม่พบรายการใบเบิกค่าการศึกษาของบุตร (แบบ 7223)
            </p>
            <p className="text-xs text-slate-500 mb-4">
              เริ่มต้นสร้างใบเบิกค่าการศึกษาของบุตร แบบ 7223 ฉบับใหม่
            </p>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              ยื่นแบบ 7223 ใหม่
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">เลขที่ใบเบิก</th>
                  <th className="px-4 py-3 text-left font-semibold">วันที่ยื่น / ปีการศึกษา</th>
                  <th className="px-4 py-3 text-left font-semibold">เจ้าหน้าที่ผู้เบิก</th>
                  <th className="px-4 py-3 text-left font-semibold">บุตรและสถานศึกษา</th>
                  <th className="px-4 py-3 text-right font-semibold">ยอดขอเบิก (บาท)</th>
                  <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                  <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono-nums font-semibold text-slate-900 whitespace-nowrap">
                      <div>{c.claimNumber}</div>
                      <div className="text-[11px] font-normal text-slate-500">
                        บุตร {c.children.length} คน
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div>{formatThaiDate(c.claimDate, true)}</div>
                      <div className="text-[11px] text-slate-500">
                        ปีการศึกษา {c.academicYear} (เทอม {c.semester})
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{c.claimantName}</div>
                      <div className="text-slate-500 truncate max-w-[180px]">
                        {c.claimantPosition}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.children.map((ch, idx) => (
                        <div key={ch.id ?? idx} className="truncate max-w-[260px]">
                          <span className="font-medium text-slate-800">{ch.childName}</span>
                          <span className="text-slate-500">
                            {' '}
                            · {ch.schoolName} ({ch.gradeLevel})
                          </span>
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
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onPrintClaim(c)}
                          title="พิมพ์แบบฟอร์ม 7223"
                          className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-md"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openApprovalModal(c)}
                          title="อนุมัติ / ปรับสถานะ"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditClaim(c)}
                          title="แก้ไข"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`ยืนยันการลบใบเบิกเลขที่ ${c.claimNumber} หรือไม่?`)) {
                              onDeleteClaim(c.id);
                            }
                          }}
                          title="ลบ"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {approvingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  อนุมัติ / อัปเดตสถานะใบเบิก แบบ 7223
                </h3>
                <p className="text-xs text-slate-500 font-mono-nums">
                  {approvingClaim.claimNumber} · {approvingClaim.claimantName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovingClaim(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleStatusSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">สถานะการเบิกจ่าย</label>
                <select
                  value={approvalForm.status}
                  onChange={(e) =>
                    setApprovalForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {Object.entries(CLAIM_STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อผู้อนุมัติ</label>
                <input
                  type="text"
                  value={approvalForm.approverName}
                  onChange={(e) =>
                    setApprovalForm((f) => ({ ...f, approverName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ตำแหน่งผู้อนุมัติ</label>
                  <input
                    type="text"
                    value={approvalForm.approverPosition}
                    onChange={(e) =>
                      setApprovalForm((f) => ({ ...f, approverPosition: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">วันที่อนุมัติ</label>
                  <input
                    type="date"
                    value={approvalForm.approvedDate}
                    onChange={(e) =>
                      setApprovalForm((f) => ({ ...f, approvedDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={approvalForm.notes}
                  onChange={(e) =>
                    setApprovalForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingClaim(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white rounded-lg font-medium"
                >
                  {savingStatus ? 'กำลังบันทึก...' : 'บันทึกผลการอนุมัติ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
