import React from 'react';
import { Edit3, FileText, Printer, X } from 'lucide-react';
import { EducationClaim } from '../types/medical';
import {
  CLAIMANT_ROLE_LABELS,
  CLAIM_STATUS_LABELS,
  SPOUSE_STATUS_LABELS,
  formatCurrency,
  formatThaiDate,
} from '../lib/thai-utils';

interface Props {
  claim: EducationClaim;
  onClose: () => void;
  onEdit: (claim: EducationClaim) => void;
  onOpenOfficialForm: (claim: EducationClaim) => void;
}

export function EducationClaimDetailModal({
  claim,
  onClose,
  onEdit,
  onOpenOfficialForm,
}: Props) {
  const handlePrintToPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print-only-container">
      {/* Action Toolbar (hidden when printing) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            รายละเอียดใบเบิกเงินสวัสดิการการศึกษาบุตร (แบบ 7223) · {claim.claimNumber}
          </h2>
          <p className="text-xs text-slate-500">
            ผู้ขอเบิก: {claim.claimantName} · สถานะ: {CLAIM_STATUS_LABELS[claim.status] || claim.status}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintToPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            Print to PDF
          </button>
          <button
            type="button"
            onClick={() => onOpenOfficialForm(claim)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-teal-700 text-teal-800 bg-teal-50/50 hover:bg-teal-50 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            แบบฟอร์มราชการ 7223
          </button>
          <button
            type="button"
            onClick={() => onEdit(claim)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" />
            แก้ไข
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            ปิด
          </button>
        </div>
      </div>

      {/* Printable A4 Detail Document */}
      <div className="py-8 px-4 print:p-0 flex justify-center">
        <div className="print-page font-form-7131 bg-white text-slate-900 w-full max-w-[210mm] p-[14mm] shadow-xl border border-slate-200 rounded-xl print:rounded-none text-[13px] leading-relaxed space-y-5">
          {/* Document Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-4 print-avoid-break">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 print:text-black">
                สำนักงานสาธารณสุขอำเภอดอนพุด จังหวัดสระบุรี
              </div>
              <h1 className="text-[18px] font-bold text-slate-950 mt-0.5">
                ใบสรุปรายละเอียดการเบิกเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร (แบบ 7223)
              </h1>
              <div className="text-xs text-slate-600 print:text-black mt-1">
                ปีการศึกษา {claim.academicYear} (ภาคเรียนที่ {claim.semester}) · สังกัด: {claim.claimantAffiliation}
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5 font-mono-nums">
              <div className="font-bold text-sm text-slate-950">เลขที่ {claim.claimNumber}</div>
              <div>ปีงบประมาณ พ.ศ. {claim.fiscalYear}</div>
              <div>วันที่ยื่นเบิก: {formatThaiDate(claim.claimDate)}</div>
              <div className="font-sans font-semibold pt-0.5">
                สถานะ: {CLAIM_STATUS_LABELS[claim.status] || claim.status}
              </div>
            </div>
          </div>

          {/* Claimant & Totals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print-avoid-break">
            <div className="border border-slate-300 print:border-black rounded-lg print:rounded-none p-3.5 space-y-1.5">
              <h2 className="text-xs font-bold text-slate-900 border-b border-slate-200 print:border-black pb-1.5 mb-2">
                1. ข้อมูลผู้ขอเบิกและสิทธิตามกฎหมาย
              </h2>
              <div className="grid grid-cols-3 gap-x-2 text-xs">
                <span className="text-slate-500 print:text-black">ชื่อ-สกุล:</span>
                <span className="col-span-2 font-semibold">{claim.claimantName}</span>
                <span className="text-slate-500 print:text-black">ตำแหน่ง:</span>
                <span className="col-span-2">{claim.claimantPosition}</span>
                <span className="text-slate-500 print:text-black">สังกัด:</span>
                <span className="col-span-2">{claim.claimantAffiliation}</span>
                <span className="text-slate-500 print:text-black">สิทธิผู้เบิก:</span>
                <span className="col-span-2">
                  {CLAIMANT_ROLE_LABELS[claim.claimantRole] || claim.claimantRole}
                </span>
              </div>
            </div>

            <div className="border border-slate-300 print:border-black rounded-lg print:rounded-none p-3.5 space-y-1.5">
              <h2 className="text-xs font-bold text-slate-900 border-b border-slate-200 print:border-black pb-1.5 mb-2">
                2. สรุปยอดเงินสวัสดิการการศึกษาบุตร
              </h2>
              <div className="grid grid-cols-3 gap-x-2 text-xs">
                <span className="text-slate-500 print:text-black">จำนวนบุตรที่เบิก:</span>
                <span className="col-span-2 font-mono-nums font-medium">
                  {claim.children.length} คน
                </span>
                <span className="text-slate-500 print:text-black">ยอดจ่ายจริงรวม:</span>
                <span className="col-span-2 font-mono-nums">
                  {formatCurrency(claim.totalAmount)} บาท
                </span>
                <span className="text-slate-500 print:text-black">ยอดเบิกตามสิทธิ:</span>
                <span className="col-span-2 font-mono-nums font-bold text-teal-800 print:text-black">
                  {formatCurrency(claim.claimableAmount)} บาท
                </span>
                <span className="text-slate-500 print:text-black">ตัวอักษร:</span>
                <span className="col-span-2">({claim.claimableAmountText})</span>
                <span className="text-slate-500 print:text-black">ประเภทการเบิก:</span>
                <span className="col-span-2">
                  {claim.entitlementBasis === 'full' ? 'ตามสิทธิ' : 'เฉพาะส่วนที่ยังขาดจากสิทธิ'}
                </span>
              </div>
            </div>
          </div>

          {/* Spouse Info */}
          <div className="border border-slate-300 print:border-black rounded-lg print:rounded-none p-4 space-y-2 print-avoid-break">
            <h2 className="text-xs font-bold text-slate-900 border-b border-slate-200 print:border-black pb-1.5">
              3. ข้อมูลคู่สมรสและคำรับรองสิทธิ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div>
                <span className="text-slate-500 print:text-black">ชื่อ-สกุลคู่สมรส: </span>
                <span className="font-semibold">{claim.spouseName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 print:text-black">สถานะการทำงาน: </span>
                <span>{SPOUSE_STATUS_LABELS[claim.spouseStatus] || claim.spouseStatus}</span>
              </div>
              {(claim.spousePosition || claim.spouseAffiliation) && (
                <>
                  <div>
                    <span className="text-slate-500 print:text-black">ตำแหน่งคู่สมรส: </span>
                    <span>{claim.spousePosition || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-black">สังกัดคู่สมรส: </span>
                    <span>{claim.spouseAffiliation || '-'}</span>
                  </div>
                </>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 print:border-slate-300 text-xs flex flex-wrap gap-x-5 gap-y-1">
              <span>[{claim.certHasRight ? '✓' : ' '}] มีสิทธิได้รับเงินช่วยเหลือตาม พ.ร.ฎ.</span>
              <span>[{claim.certChildEligible ? '✓' : ' '}] บุตรอยู่ในข่ายได้รับความช่วยเหลือ</span>
              <span>[{claim.certSoleClaimant ? '✓' : ' '}] ใช้สิทธิเบิกแต่เพียงฝ่ายเดียว</span>
              {claim.certSpouseLowerBenefit && (
                <span>
                  [✓] คู่สมรสได้รับต่ำกว่าสิทธิราชการ ({formatCurrency(claim.spouseLowerAmount)} บาท)
                </span>
              )}
            </div>
          </div>

          {/* Children & Fees Table */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-900">
              4. รายการบุตร สถานศึกษา และใบเสร็จค่าเล่าเรียน ({claim.children.length} คน)
            </h2>
            <table className="w-full border-collapse border border-slate-400 print:border-black text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-400 print:border-black px-2 py-2 text-center w-10">
                    ลำดับ
                  </th>
                  <th className="border border-slate-400 print:border-black px-2 py-2 text-left">
                    ชื่อ-สกุลบุตร / วันเกิด
                  </th>
                  <th className="border border-slate-400 print:border-black px-2 py-2 text-left">
                    สถานศึกษา / อำเภอ / จังหวัด
                  </th>
                  <th className="border border-slate-400 print:border-black px-2 py-2 text-left">
                    ชั้นเรียน / ประเภทเงิน
                  </th>
                  <th className="border border-slate-400 print:border-black px-2 py-2 text-left w-28">
                    เลขที่ใบเสร็จ
                  </th>
                  <th className="border border-slate-400 print:border-black px-2 py-2 text-right w-24">
                    จำนวนเงิน
                  </th>
                </tr>
              </thead>
              <tbody>
                {claim.children.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-slate-400 print:border-black px-3 py-4 text-center text-slate-500"
                    >
                      ไม่มีรายการบุตร
                    </td>
                  </tr>
                ) : (
                  claim.children.map((ch, idx) => {
                    const feeTypes: string[] = [];
                    if (ch.isMaintenanceFee) feeTypes.push('(1) บำรุงการศึกษา');
                    if (ch.isTuitionFee) feeTypes.push('(2) ค่าเล่าเรียน');
                    return (
                      <tr key={ch.id ?? idx}>
                        <td className="border border-slate-400 print:border-black px-2 py-1.5 text-center font-mono-nums">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-400 print:border-black px-2 py-1.5">
                          <div className="font-semibold">{ch.childName}</div>
                          <div className="text-[11px] text-slate-600 print:text-black">
                            เกิด {ch.childBirthDate ? formatThaiDate(ch.childBirthDate, true) : '-'} ·
                            ลำดับบิดา {ch.fatherChildOrder ?? '-'} / มารดา {ch.motherChildOrder ?? '-'}
                          </div>
                        </td>
                        <td className="border border-slate-400 print:border-black px-2 py-1.5">
                          <div className="font-medium">{ch.schoolName}</div>
                          <div className="text-[11px] text-slate-600 print:text-black">
                            {[ch.schoolDistrict && `อ.${ch.schoolDistrict}`, ch.schoolProvince && `จ.${ch.schoolProvince}`]
                              .filter(Boolean)
                              .join(' ') || '-'}
                          </div>
                        </td>
                        <td className="border border-slate-400 print:border-black px-2 py-1.5">
                          <div>{ch.gradeLevel}</div>
                          <div className="text-[11px] text-slate-600 print:text-black">
                            {feeTypes.join(' · ') || '-'}
                          </div>
                        </td>
                        <td className="border border-slate-400 print:border-black px-2 py-1.5 font-mono-nums">
                          <div>{ch.receiptNumber || '-'}</div>
                          {ch.receiptDate && (
                            <div className="text-[11px] text-slate-600 print:text-black">
                              {formatThaiDate(ch.receiptDate, true)}
                            </div>
                          )}
                        </td>
                        <td className="border border-slate-400 print:border-black px-2 py-1.5 text-right font-mono-nums">
                          {formatCurrency(ch.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
                <tr className="font-semibold bg-slate-50">
                  <td
                    colSpan={5}
                    className="border border-slate-400 print:border-black px-2.5 py-2 text-right"
                  >
                    รวมยอดค่าการศึกษาทั้งสิ้น ({claim.totalAmountText})
                  </td>
                  <td className="border border-slate-400 print:border-black px-2.5 py-2 text-right font-mono-nums">
                    {formatCurrency(claim.totalAmount)}
                  </td>
                </tr>
                <tr className="font-bold bg-slate-100">
                  <td
                    colSpan={5}
                    className="border border-slate-400 print:border-black px-2.5 py-2 text-right"
                  >
                    ยอดเงินที่ขอเบิกได้ตามสิทธิ ({claim.claimableAmountText})
                  </td>
                  <td className="border border-slate-400 print:border-black px-2.5 py-2 text-right font-mono-nums">
                    {formatCurrency(claim.claimableAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Approval & Signature Footer */}
          <div className="border border-slate-300 print:border-black rounded-lg print:rounded-none p-4 space-y-4 print-avoid-break">
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-900">5. ข้อมูลการพิจารณาอนุมัติ</div>
                <div>
                  <span className="text-slate-500 print:text-black">สถานะ: </span>
                  <span className="font-semibold">
                    {CLAIM_STATUS_LABELS[claim.status] || claim.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-black">ผู้อนุมัติ: </span>
                  <span>{claim.approverName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-black">ตำแหน่ง: </span>
                  <span>{claim.approverPosition || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-black">วันที่อนุมัติ: </span>
                  <span>{claim.approvedDate ? formatThaiDate(claim.approvedDate) : '-'}</span>
                </div>
                {claim.notes && (
                  <div>
                    <span className="text-slate-500 print:text-black">หมายเหตุ: </span>
                    <span>{claim.notes}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-b border-dotted border-slate-600 h-6" />
                  <div>({claim.claimantName})</div>
                  <div className="text-slate-500 print:text-black">ผู้ขอรับเงินสวัสดิการ</div>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-dotted border-slate-600 h-6" />
                  <div>({claim.approverName || '........................................'})</div>
                  <div className="text-slate-500 print:text-black">ผู้มีอำนาจอนุมัติ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
