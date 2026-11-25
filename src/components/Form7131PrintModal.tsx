import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';
import { MedicalClaim } from '../types/medical';
import {
  formatCurrency,
  formatNationalId,
  formatThaiDate,
} from '../lib/thai-utils';

interface Props {
  claim: MedicalClaim;
  onClose: () => void;
}

const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

function splitThaiDate(dateStr?: string | null) {
  if (!dateStr) return { day: '', month: '', year: '' };
  const parts = dateStr.split('-');
  if (parts.length !== 3) return { day: '', month: '', year: '' };
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || m < 0 || m > 11 || Number.isNaN(d)) {
    return { day: '', month: '', year: '' };
  }
  return {
    day: String(d),
    month: THAI_MONTHS_FULL[m],
    year: String(y > 2400 ? y : y + 543),
  };
}

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 border border-black text-[11px] leading-none font-bold mr-1.5 shrink-0 align-middle">
      {checked ? '✓' : ''}
    </span>
  );
}

function BoxLabel({ letter }: { letter: string }) {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 border border-black text-[11px] leading-none font-semibold mr-2.5 shrink-0 mt-0.5">
      {letter}
    </span>
  );
}

export function Form7131PrintModal({ claim, onClose }: Props) {
  const [submittedTo, setSubmittedTo] = useState('นายแพทย์สาธารณสุขจังหวัดสระบุรี');
  const [payerName, setPayerName] = useState('นส.สุธิดา อาวรรณ์');

  const claimDateParts = splitThaiDate(claim.claimDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print-only-container">
      {/* Sticky Print Toolbar (hidden when printing) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              ตัวอย่างเอกสารราชการ แบบ 7131 (เลขที่ {claim.claimNumber})
            </h2>
            <p className="text-xs text-slate-500">
              หน้า 1: ส่วนที่ 1–3 · หน้า 2: ส่วนที่ 4–6 และคำชี้แจง · หน้า 3: บัญชีใบเสร็จรับเงินแนบท้าย
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Print to PDF / พิมพ์แบบ 7131
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

        {/* Optional quick customization for Section 4 & 6 */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 text-slate-600">
            <span className="whitespace-nowrap">ส่วนที่ 4 เสนอ:</span>
            <input
              type="text"
              value={submittedTo}
              onChange={(e) => setSubmittedTo(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-md text-slate-900 w-64 bg-slate-50"
            />
          </label>
          <label className="flex items-center gap-2 text-slate-600">
            <span className="whitespace-nowrap">ส่วนที่ 6 ผู้จ่ายเงิน:</span>
            <input
              type="text"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-md text-slate-900 w-52 bg-slate-50"
            />
          </label>
        </div>
      </div>

      {/* A4 Official Form Sheets */}
      <div className="py-8 px-4 print:p-0 flex flex-col items-center gap-8 print:gap-0">
        {/* PAGE 1: Sections 1, 2, 3 (Unchanged) */}
        <div className="print-page font-form-7131 bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-[14mm] shadow-xl border border-slate-200 text-[13.5px] leading-[1.65]">
          {/* Top-right Form Number */}
          <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] text-slate-600 font-mono-nums">
              เลขที่อ้างอิง: {claim.claimNumber}
            </span>
            <span className="text-[14px] font-bold">แบบ 7131</span>
          </div>

          {/* Official Title */}
          <div className="text-center mb-4">
            <h1 className="text-[18px] font-bold tracking-tight">
              ใบเบิกเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล
            </h1>
            <p className="text-[13px]">
              โปรดทำเครื่องหมาย / ลงในช่องว่าง ( ) พร้อมทั้งกรอกข้อความเท่าที่จำเป็น
            </p>
          </div>

          {/* Main Outer Frame matching image_7ead15f0.png (Sections 1, 2, 3) */}
          <div className="border-[1.5px] border-black">
            {/* Section 1 */}
            <div className="p-3.5 border-b-[1.5px] border-black space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">1.</span>
                <span>ข้าพเจ้า</span>
                <span className="dotted-fill flex-1 min-w-[200px] font-medium">
                  {claim.claimantName}
                </span>
                <span>ตำแหน่ง</span>
                <span className="dotted-fill flex-1 min-w-[180px] font-medium">
                  {claim.claimantPosition}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 pl-5">
                <span>สังกัด</span>
                <span className="dotted-fill flex-1 font-medium">
                  {claim.claimantAffiliation}
                </span>
              </div>
            </div>

            {/* Section 2 */}
            <div className="p-3.5 border-b-[1.5px] border-black space-y-2">
              <div className="font-semibold">2. ขอเบิกเงินค่ารักษาพยาบาลของ</div>

              <div className="pl-6 space-y-1.5">
                {/* Self */}
                <div className="flex items-center">
                  <CheckMark checked={claim.patientType === 'self'} />
                  <span>ตนเอง</span>
                </div>

                {/* Spouse */}
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <div className="flex items-center min-w-[85px]">
                    <CheckMark checked={claim.patientType === 'spouse'} />
                    <span>คู่สมรส</span>
                  </div>
                  <span>ชื่อ</span>
                  <span className="dotted-fill flex-1 min-w-[170px] font-medium">
                    {claim.patientType === 'spouse' ? claim.patientName : ''}
                  </span>
                  <span>เลขประจำตัวประชาชน</span>
                  <span className="dotted-fill w-[160px] font-mono-nums text-[12.5px]">
                    {claim.patientType === 'spouse'
                      ? formatNationalId(claim.patientNationalId)
                      : ''}
                  </span>
                </div>

                {/* Father */}
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <div className="flex items-center min-w-[85px]">
                    <CheckMark checked={claim.patientType === 'father'} />
                    <span>บิดา</span>
                  </div>
                  <span>ชื่อ</span>
                  <span className="dotted-fill flex-1 min-w-[170px] font-medium">
                    {claim.patientType === 'father' ? claim.patientName : ''}
                  </span>
                  <span>เลขประจำตัวประชาชน</span>
                  <span className="dotted-fill w-[160px] font-mono-nums text-[12.5px]">
                    {claim.patientType === 'father'
                      ? formatNationalId(claim.patientNationalId)
                      : ''}
                  </span>
                </div>

                {/* Mother */}
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <div className="flex items-center min-w-[85px]">
                    <CheckMark checked={claim.patientType === 'mother'} />
                    <span>มารดา</span>
                  </div>
                  <span>ชื่อ</span>
                  <span className="dotted-fill flex-1 min-w-[170px] font-medium">
                    {claim.patientType === 'mother' ? claim.patientName : ''}
                  </span>
                  <span>เลขประจำตัวประชาชน</span>
                  <span className="dotted-fill w-[160px] font-mono-nums text-[12.5px]">
                    {claim.patientType === 'mother'
                      ? formatNationalId(claim.patientNationalId)
                      : ''}
                  </span>
                </div>

                {/* Child */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <div className="flex items-center min-w-[85px]">
                      <CheckMark checked={claim.patientType === 'child'} />
                      <span>บุตร</span>
                    </div>
                    <span>ชื่อ</span>
                    <span className="dotted-fill flex-1 min-w-[170px] font-medium">
                      {claim.patientType === 'child' ? claim.patientName : ''}
                    </span>
                    <span>เลขประจำตัวประชาชน</span>
                    <span className="dotted-fill w-[160px] font-mono-nums text-[12.5px]">
                      {claim.patientType === 'child'
                        ? formatNationalId(claim.patientNationalId)
                        : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 pl-[88px]">
                    <span>เกิดเมื่อ</span>
                    <span className="dotted-fill w-[180px] font-medium">
                      {claim.patientType === 'child' && claim.childBirthDate
                        ? formatThaiDate(claim.childBirthDate)
                        : ''}
                    </span>
                    <span>เป็นบุตรลำดับที่</span>
                    <span className="dotted-fill w-[60px] text-center font-medium">
                      {claim.patientType === 'child' && claim.childOrder
                        ? claim.childOrder
                        : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 pl-[88px]">
                    <div className="flex items-center">
                      <CheckMark
                        checked={claim.patientType === 'child' && Boolean(claim.isMinor)}
                      />
                      <span>ยังไม่บรรลุนิติภาวะ</span>
                    </div>
                    <div className="flex items-center">
                      <CheckMark
                        checked={
                          claim.patientType === 'child' && Boolean(claim.isIncapacitated)
                        }
                      />
                      <span>เป็นบุตรไร้ความสามารถ หรือเสมือนไร้ความสามารถ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment details */}
              <div className="pt-2 space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span>ป่วยเป็นโรค</span>
                  <span className="dotted-fill flex-1 font-medium">
                    {claim.diagnosis}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span>และได้รับการตรวจรักษาพยาบาลจาก (ชื่อสถานพยาบาล)</span>
                  <span className="dotted-fill flex-1 font-medium">
                    {claim.hospitalName}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span>ซึ่งเป็นสถานพยาบาลของ</span>
                  <span className="inline-flex items-center">
                    <CheckMark checked={claim.hospitalType === 'public'} />
                    <span>ทางราชการ</span>
                  </span>
                  <span className="inline-flex items-center">
                    <CheckMark checked={claim.hospitalType === 'private'} />
                    <span>เอกชน</span>
                  </span>
                  <span>ตั้งแต่วันที่</span>
                  <span className="dotted-fill min-w-[130px] text-center font-medium">
                    {formatThaiDate(claim.treatmentStartDate)}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span>ถึงวันที่</span>
                  <span className="dotted-fill min-w-[140px] text-center font-medium">
                    {formatThaiDate(claim.treatmentEndDate)}
                  </span>
                  <span>เป็นเงินรวมทั้งสิ้น</span>
                  <span className="dotted-fill flex-1 text-right font-mono-nums font-semibold">
                    {formatCurrency(claim.totalAmount)}
                  </span>
                  <span>บาท</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span>(</span>
                  <span className="dotted-fill flex-1 text-center font-medium">
                    {claim.totalAmountText}
                  </span>
                  <span>) ตามใบเสร็จรับเงินที่แนบ จำนวน</span>
                  <span className="dotted-fill w-[55px] text-center font-mono-nums font-semibold">
                    {claim.receiptCount}
                  </span>
                  <span>ฉบับ</span>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="p-3.5 space-y-2">
              <div className="font-semibold">
                3. ข้าพเจ้ามีสิทธิได้รับเงินค่ารักษาพยาบาล ตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล
              </div>

              <div className="pl-6 grid grid-cols-12 gap-y-1.5">
                <div className="col-span-4 flex items-center">
                  <CheckMark checked={claim.entitlementBasis === 'full'} />
                  <span>ตามสิทธิ</span>
                </div>
                <div className="col-span-8 flex items-center">
                  <CheckMark checked={claim.entitlementBasis === 'excess_other_agency'} />
                  <span>เฉพาะส่วนที่ขาดอยู่จากสิทธิที่ได้รับจากหน่วยงานอื่น</span>
                </div>
                <div className="col-span-4" />
                <div className="col-span-8 flex items-center">
                  <CheckMark checked={claim.entitlementBasis === 'excess_insurance'} />
                  <span>เฉพาะส่วนที่ขาดอยู่จากสัญญาประกันภัย</span>
                </div>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-2 pt-1">
                <span>เป็นเงิน</span>
                <span className="dotted-fill w-[130px] text-right font-mono-nums font-semibold">
                  {formatCurrency(claim.claimableAmount)}
                </span>
                <span>บาท (</span>
                <span className="dotted-fill flex-1 text-center font-medium">
                  {claim.claimableAmountText}
                </span>
                <span>) และ</span>
              </div>

              {/* (1) ข้าพเจ้า */}
              <div className="flex items-start gap-x-4 pt-1">
                <div className="w-[155px] shrink-0 font-medium">(1) ข้าพเจ้า</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start">
                    <CheckMark checked={claim.selfRightsOption === 'none'} />
                    <span>ไม่มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่น</span>
                  </div>
                  <div className="flex items-start">
                    <CheckMark checked={claim.selfRightsOption === 'choose_gov'} />
                    <span>มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่นแต่เลือกใช้สิทธิจากทางราชการ</span>
                  </div>
                  <div className="flex items-start">
                    <CheckMark checked={claim.selfRightsOption === 'insurance'} />
                    <span>มีสิทธิได้รับค่ารักษาพยาบาลตามสัญญาประกันภัย</span>
                  </div>
                  <div className="flex items-start">
                    <CheckMark checked={claim.selfRightsOption === 'sole_child_claimant'} />
                    <span>เป็นผู้ใช้สิทธิเบิกค่ารักษาพยาบาลสำหรับบุตรแต่เพียงฝ่ายเดียว</span>
                  </div>
                </div>
              </div>

              {/* (2) ผู้เกี่ยวข้อง */}
              <div className="flex items-start gap-x-4 pt-1">
                <div className="w-[155px] shrink-0 flex items-baseline gap-1">
                  <span>(2)</span>
                  <span className="dotted-fill flex-1 text-center text-[12.5px]">
                    {claim.relatedPersonRole || ''}
                  </span>
                  <span>ข้าพเจ้า</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start">
                    <CheckMark checked={claim.relatedRightsOption === 'none'} />
                    <span>ไม่มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่น</span>
                  </div>
                  <div className="flex items-start">
                    <CheckMark checked={claim.relatedRightsOption === 'lower_than_decree'} />
                    <span>
                      มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่น แต่ค่ารักษาพยาบาลที่ได้รับต่ำกว่าสิทธิตามพระราชกฤษฎีกาฯ
                    </span>
                  </div>
                  <div className="flex items-start">
                    <CheckMark checked={claim.relatedRightsOption === 'insurance'} />
                    <span>มีสิทธิได้รับค่ารักษาพยาบาลตามสัญญาประกันภัย</span>
                  </div>
                  <div className="flex items-start">
                    <CheckMark checked={claim.relatedRightsOption === 'dependent_of_other'} />
                    <span>
                      มีสิทธิได้รับค่ารักษาพยาบาลจากหน่วยงานอื่นในฐานะเป็นผู้อาศัยสิทธิของผู้อื่น
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2: Sections 4, 5, 6 and คำชี้แจง matching image_19d24df0.png */}
        <div className="print-page page-break-before font-form-7131 bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-[14mm] shadow-xl border border-slate-200 text-[13.5px] leading-[1.75]">
          {/* Single outer frame containing Sections 4, 5, 6 */}
          <div className="border-[1.5px] border-black">
            {/* Section 4 */}
            <div className="px-6 py-5 border-b-[1.5px] border-black space-y-4">
              <div className="font-medium">
                4. &nbsp;&nbsp;เสนอ {submittedTo}
              </div>

              <p className="indent-16 leading-[1.85]">
                ข้าพเจ้าขอรับรองว่า ข้าพเจ้ามีสิทธิเบิกค่ารักษาพยาบาลสำหรับตนเองและบุคคลในครอบครัวตามจำนวนที่ขอเบิกซึ่งกำหนดไว้ในกฎหมาย และข้อความข้างต้นเป็นจริงทุกประการ
              </p>

              <div className="pt-4 flex justify-end pr-4">
                <div className="w-[340px] space-y-1.5 text-[13.5px]">
                  <div className="flex items-baseline gap-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="dotted-fill flex-1" />
                    <span className="whitespace-nowrap">ผู้ขอรับเงินสวัสดิการ</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1 pr-16">
                    <span>(</span>
                    <span className="dotted-fill min-w-[180px] text-center font-medium">
                      {claim.claimantName}
                    </span>
                    <span>)</span>
                  </div>
                  <div className="flex items-baseline gap-1 pt-0.5">
                    <span>วันที่</span>
                    <span className="dotted-fill w-[42px] text-center font-medium">
                      {claimDateParts.day}
                    </span>
                    <span>เดือน</span>
                    <span className="dotted-fill w-[95px] text-center font-medium">
                      {claimDateParts.month}
                    </span>
                    <span>พ.ศ.</span>
                    <span className="dotted-fill w-[55px] text-center font-medium">
                      {claimDateParts.year}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="px-6 py-5 border-b-[1.5px] border-black min-h-[185px] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="font-medium">5. &nbsp;&nbsp;คำอนุมัติ</div>
                <div className="pl-28">อนุมัติให้เบิกได้</div>
              </div>

              <div className="pt-6 pb-2 flex justify-end pr-16">
                <div className="w-[260px] space-y-1.5 text-[13.5px]">
                  <div className="flex items-baseline gap-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="dotted-fill flex-1" />
                  </div>
                  {claim.approverName && (
                    <div className="text-center text-[12.5px] text-slate-800 pl-8">
                      ({claim.approverName})
                    </div>
                  )}
                  {claim.approverPosition && (
                    <div className="text-center text-[12.5px] text-slate-800 pl-8">
                      ตำแหน่ง {claim.approverPosition}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="px-6 py-5 space-y-3">
              <div className="font-medium">6. &nbsp;&nbsp;ใบรับเงิน</div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-1.5 pl-12">
                  <span>ได้รับเงินสวัสดิการเกี่ยวกับการรักษาพยาบาลจำนวน</span>
                  <span className="dotted-fill flex-1 min-w-[110px] text-center font-mono-nums font-semibold">
                    {formatCurrency(claim.claimableAmount)}
                  </span>
                  <span>บาท</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>(</span>
                  <span className="dotted-fill flex-1 text-center font-medium">
                    {claim.claimableAmountText}
                  </span>
                  <span>) ไว้ถูกต้องแล้ว</span>
                </div>
              </div>

              {/* Receiver signature */}
              <div className="pt-5 flex justify-end pr-10">
                <div className="w-[290px] space-y-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="dotted-fill flex-1" />
                    <span className="whitespace-nowrap">ผู้รับเงิน</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1 pr-10">
                    <span>(</span>
                    <span className="dotted-fill min-w-[180px] text-center font-medium">
                      {claim.claimantName}
                    </span>
                    <span>)</span>
                  </div>
                </div>
              </div>

              {/* Payer signature */}
              <div className="pt-5 flex justify-end pr-10">
                <div className="w-[310px] space-y-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="dotted-fill flex-1" />
                    <span className="whitespace-nowrap">ผู้จ่ายเงิน</span>
                  </div>
                  <div className="text-center pr-6">
                    <span>({payerName})</span>
                  </div>
                  <div className="flex items-baseline gap-1 pt-0.5">
                    <span>วันที่</span>
                    <span className="dotted-fill w-[46px]" />
                    <span>เดือน</span>
                    <span className="dotted-fill w-[95px]" />
                    <span>พ.ศ.</span>
                    <span className="dotted-fill w-[55px]" />
                  </div>
                  <div className="text-center text-[12px] pt-0.5 pr-4">
                    (ลงชื่อต่อเมื่อได้รับเงินแล้วเท่านั้น)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footnotes: คำชี้แจง */}
          <div className="mt-5 px-2 space-y-1.5 text-[12.5px] leading-[1.6]">
            <div className="font-semibold mb-1">คำชี้แจง</div>
            <div className="flex items-start pl-2">
              <BoxLabel letter="ก" />
              <span>
                ให้แนบสำเนาคำสั่งศาลที่สั่งฯ หมายให้เป็นบุคคลไร้ความสามารถหรือเสมือนไร้ความสามารถ
              </span>
            </div>
            <div className="flex items-start pl-2">
              <BoxLabel letter="ข" />
              <span>
                ให้มีคำชี้แจงด้วยว่า มีสิทธิเพียงใด และขาดอยู่เท่าใด กรณีได้รับจากหน่วยงานอื่นเมื่อเทียบสิทธิตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล หรือขาดอยู่เท่าใดเมื่อได้รับค่ารักษาพยาบาลตามสัญญาประกันภัย
              </span>
            </div>
            <div className="flex items-start pl-2">
              <BoxLabel letter="ค" />
              <span>ให้เติมคำว่า คู่สมรส บิดา มารดา หรือบุตร แล้วแต่กรณี</span>
            </div>
            <div className="flex items-start pl-2">
              <BoxLabel letter="ง" />
              <span>ให้เสนอต่อผู้มีอำนาจอนุมัติ</span>
            </div>
          </div>
        </div>

        {/* PAGE 3: Itemized Receipts Attachment Table */}
        <div className="print-page page-break-before font-form-7131 bg-white text-black w-full max-w-[210mm] p-[14mm] shadow-xl border border-slate-200 text-[13px] leading-[1.6]">
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
            <div>
              <h2 className="text-[16px] font-bold">
                บัญชีรายละเอียดใบเสร็จรับเงินและค่ารักษาพยาบาลแนบท้าย แบบ 7131
              </h2>
              <p className="text-[12.5px]">
                เลขที่ใบเบิก: {claim.claimNumber} · ผู้ขอเบิก: {claim.claimantName} · สังกัด: {claim.claimantAffiliation}
              </p>
            </div>
            <div className="text-right text-[12.5px]">
              <div>วันที่ยื่น: {formatThaiDate(claim.claimDate)}</div>
              <div>สถานพยาบาล: {claim.hospitalName}</div>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[12.5px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black px-2.5 py-2 text-center w-10">ลำดับ</th>
                <th className="border border-black px-2.5 py-2 text-left w-28">เลขที่ใบเสร็จ</th>
                <th className="border border-black px-2.5 py-2 text-center w-28">วันที่ใบเสร็จ</th>
                <th className="border border-black px-2.5 py-2 text-left">หมวดค่ารักษาพยาบาล</th>
                <th className="border border-black px-2.5 py-2 text-left">รายละเอียดรายการ</th>
                <th className="border border-black px-2.5 py-2 text-right w-28">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {claim.receipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-black px-3 py-4 text-center text-slate-500">
                    ไม่มีรายการใบเสร็จรับเงินแยกย่อย
                  </td>
                </tr>
              ) : (
                claim.receipts.map((item, idx) => (
                  <tr key={item.id ?? idx}>
                    <td className="border border-black px-2.5 py-1.5 text-center font-mono-nums">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-2.5 py-1.5 font-mono-nums">
                      {item.receiptNumber}
                    </td>
                    <td className="border border-black px-2.5 py-1.5 text-center">
                      {formatThaiDate(item.receiptDate, true)}
                    </td>
                    <td className="border border-black px-2.5 py-1.5">{item.category}</td>
                    <td className="border border-black px-2.5 py-1.5">{item.description}</td>
                    <td className="border border-black px-2.5 py-1.5 text-right font-mono-nums">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              )}
              <tr className="font-bold bg-slate-50">
                <td colSpan={5} className="border border-black px-2.5 py-2 text-right">
                  รวมเงินตามใบเสร็จรับเงินทั้งสิ้น ({claim.totalAmountText})
                </td>
                <td className="border border-black px-2.5 py-2 text-right font-mono-nums">
                  {formatCurrency(claim.totalAmount)}
                </td>
              </tr>
              <tr className="font-bold">
                <td colSpan={5} className="border border-black px-2.5 py-2 text-right">
                  ยอดเงินที่มีสิทธิเบิกได้จริง ({claim.claimableAmountText})
                </td>
                <td className="border border-black px-2.5 py-2 text-right font-mono-nums">
                  {formatCurrency(claim.claimableAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
