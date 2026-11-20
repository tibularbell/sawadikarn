import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';
import { EducationClaim, EducationClaimChild } from '../types/medical';
import { formatCurrency, formatThaiDate } from '../lib/thai-utils';

interface Props {
  claim: EducationClaim;
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

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[11px] leading-none font-bold mr-1.5 shrink-0 align-middle">
      {checked ? '✓' : ''}
    </span>
  );
}

export function Form7223PrintModal({ claim, onClose }: Props) {
  const [submittedTo, setSubmittedTo] = useState('นายแพทย์สาธารณสุขจังหวัดสระบุรี');
  const [payerName, setPayerName] = useState('นส.สุธิดา อาวรรณ์');

  const claimDateParts = splitThaiDate(claim.claimDate);

  // Ensure at least 3 numbered child slots on Page 1 matching image_b500e08c.png
  const childSlots: (EducationClaimChild | null)[] = [0, 1, 2].map(
    (idx) => claim.children[idx] || null
  );
  const extraChildren = claim.children.slice(3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print-only-container">
      {/* Sticky Print Toolbar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              ตัวอย่างเอกสารราชการ แบบ 7223 (เลขที่ {claim.claimNumber})
            </h2>
            <p className="text-xs text-slate-500">
              หน้า 1: ส่วนที่ 1–4 · หน้า 2: ส่วนที่ 5–8 และคำชี้แจง · หน้า 3: บัญชีรายละเอียดใบเสร็จสถานศึกษา
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              พิมพ์แบบ 7223 / บันทึก PDF
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

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 text-slate-600">
            <span className="whitespace-nowrap">ส่วนที่ 6 เสนอ:</span>
            <input
              type="text"
              value={submittedTo}
              onChange={(e) => setSubmittedTo(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-md text-slate-900 w-64 bg-slate-50"
            />
          </label>
          <label className="flex items-center gap-2 text-slate-600">
            <span className="whitespace-nowrap">ส่วนที่ 8 ผู้จ่ายเงิน:</span>
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
        {/* PAGE 1: Sections 1, 2, 3, 4 matching image_b500e08c.png */}
        <div className="print-page font-form-7131 bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-[12mm] shadow-xl border border-slate-200 text-[12.5px] leading-[1.52]">
          {/* Header */}
          <div className="relative text-center mb-2.5">
            <span className="absolute right-0 top-0 text-[13px] font-bold">
              แบบ 7223
            </span>
            <span className="absolute left-0 top-0 text-[10.5px] text-slate-600 font-mono-nums">
              {claim.claimNumber}
            </span>
            <h1 className="text-[16.5px] font-bold">
              ใบเบิกเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร
            </h1>
            <p className="text-[12.5px] font-semibold">
              โปรดทำเครื่องหมาย ✓ ลงในช่อง □ พร้อมทั้งกรอกข้อความเท่าที่จำเป็น
            </p>
          </div>

          <div className="border-[1.5px] border-black">
            {/* Section 1 */}
            <div className="px-3 py-2 border-b-[1.5px] border-black space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold">1.</span>
                <span>ข้าพเจ้า</span>
                <span className="dotted-fill flex-1 min-w-[180px] font-medium">
                  {claim.claimantName}
                </span>
                <span>ตำแหน่ง</span>
                <span className="dotted-fill flex-1 min-w-[170px] font-medium">
                  {claim.claimantPosition}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-1.5 pl-4">
                <span>สังกัด</span>
                <span className="dotted-fill flex-1 font-medium">
                  {claim.claimantAffiliation}
                </span>
              </div>
            </div>

            {/* Section 2 */}
            <div className="px-3 py-2 border-b-[1.5px] border-black space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold">2.</span>
                <span>คู่สมรสของข้าพเจ้าชื่อ</span>
                <span className="dotted-fill flex-1 font-medium">
                  {claim.spouseName || ''}
                </span>
              </div>
              <div className="pl-5 space-y-1">
                <div className="flex items-center">
                  <CheckBox checked={claim.spouseStatus === 'not_gov'} />
                  <span>ไม่เป็นข้าราชการหรือลูกจ้างประจำ</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="inline-flex items-center">
                    <CheckBox checked={claim.spouseStatus === 'gov_officer'} />
                    <span>เป็นข้าราชการ</span>
                  </span>
                  <span className="inline-flex items-center ml-2">
                    <CheckBox checked={claim.spouseStatus === 'permanent_employee'} />
                    <span>ลูกจ้างประจำ</span>
                  </span>
                  <span>ตำแหน่ง</span>
                  <span className="dotted-fill flex-1 min-w-[140px] font-medium">
                    {claim.spouseStatus === 'gov_officer' ||
                    claim.spouseStatus === 'permanent_employee'
                      ? claim.spousePosition || ''
                      : ''}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1.5 pl-5">
                  <span>สังกัด</span>
                  <span className="dotted-fill flex-1 font-medium">
                    {claim.spouseStatus === 'gov_officer' ||
                    claim.spouseStatus === 'permanent_employee'
                      ? claim.spouseAffiliation || ''
                      : ''}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-start">
                    <CheckBox checked={claim.spouseStatus === 'state_enterprise_or_other'} />
                    <span className="leading-snug">
                      เป็นพนักงานหรือลูกจ้างในรัฐวิสาหกิจ/หน่วยงานของส่วนราชการ ราชการส่วนท้องถิ่น กรุงเทพมหานคร องค์กรอิสระ องค์การมหาชน หรือหน่วยงานอื่นใด
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-1.5 pl-5">
                    <span>ตำแหน่ง</span>
                    <span className="dotted-fill flex-1 min-w-[150px] font-medium">
                      {claim.spouseStatus === 'state_enterprise_or_other'
                        ? claim.spousePosition || ''
                        : ''}
                    </span>
                    <span>สังกัด</span>
                    <span className="dotted-fill flex-1 min-w-[150px] font-medium">
                      {claim.spouseStatus === 'state_enterprise_or_other'
                        ? claim.spouseAffiliation || ''
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="px-3 py-2 border-b-[1.5px] border-black space-y-1">
              <div className="font-semibold">
                3. ข้าพเจ้าเป็นผู้มีสิทธิและขอใช้สิทธิเนื่องจาก
              </div>
              <div className="pl-5 space-y-0.5">
                <div className="flex items-center">
                  <CheckBox checked={claim.claimantRole === 'lawful_father'} />
                  <span>เป็นบิดาชอบด้วยกฎหมาย</span>
                </div>
                <div className="flex items-center">
                  <CheckBox checked={claim.claimantRole === 'mother'} />
                  <span>เป็นมารดา</span>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="px-3 py-2 space-y-2">
              <div>
                <div className="font-semibold">
                  4. ข้าพเจ้าได้จ่ายเงินสำหรับการศึกษาของบุตร ดังนี้
                </div>
                <div className="pl-16 flex items-center gap-16 text-[12px]">
                  <span>(1) เงินบำรุงการศึกษา</span>
                  <span>(2) เงินค่าเล่าเรียน</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {childSlots.map((child, idx) => (
                  <div key={idx} className="space-y-0.5 text-[12px]">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="font-semibold w-4">{idx + 1}.</span>
                      <span>บุตรชื่อ</span>
                      <span className="dotted-fill flex-1 min-w-[190px] font-medium">
                        {child?.childName || ''}
                      </span>
                      <span>เกิดเมื่อ</span>
                      <span className="dotted-fill w-[160px] font-medium">
                        {child?.childBirthDate ? formatThaiDate(child.childBirthDate) : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-1.5 pl-5">
                      <span>เป็นบุตรลำดับที่ (ของบิดา)</span>
                      <span className="dotted-fill w-[65px] text-center font-medium">
                        {child?.fatherChildOrder || ''}
                      </span>
                      <span>เป็นบุตรลำดับที่ (ของมารดา)</span>
                      <span className="dotted-fill w-[65px] text-center font-medium">
                        {child?.motherChildOrder || ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-1.5 pl-5">
                      <span>(กรณีเป็นบุตรแทนที่บุตรซึ่งถึงแก่กรรมแล้ว) แทนที่บุตรลำดับที่</span>
                      <span className="dotted-fill flex-1 text-center font-medium">
                        {child?.replacingDeceasedOrder || ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-1.5 pl-5">
                      <span>ชื่อ</span>
                      <span className="dotted-fill flex-1 min-w-[120px] font-medium">
                        {child?.deceasedChildName || ''}
                      </span>
                      <span>เกิดเมื่อ</span>
                      <span className="dotted-fill w-[110px] font-medium">
                        {child?.deceasedChildBirthDate
                          ? formatThaiDate(child.deceasedChildBirthDate, true)
                          : ''}
                      </span>
                      <span>ถึงแก่กรรมเมื่อ</span>
                      <span className="dotted-fill w-[110px] font-medium">
                        {child?.deceasedChildDeathDate
                          ? formatThaiDate(child.deceasedChildDeathDate, true)
                          : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-1.5 pl-5">
                      <span>สถานศึกษา</span>
                      <span className="dotted-fill flex-1 min-w-[160px] font-medium">
                        {child?.schoolName || ''}
                      </span>
                      <span>อำเภอ</span>
                      <span className="dotted-fill w-[105px] font-medium">
                        {child?.schoolDistrict || ''}
                      </span>
                      <span>จังหวัด</span>
                      <span className="dotted-fill w-[105px] font-medium">
                        {child?.schoolProvince || ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-2 pl-5">
                      <span>ชั้นที่ศึกษา</span>
                      <span className="dotted-fill w-[150px] font-medium">
                        {child?.gradeLevel || ''}
                      </span>
                      <span className="inline-flex items-center">
                        <span className="mr-1">(1)</span>
                        <CheckBox checked={Boolean(child?.isMaintenanceFee)} />
                      </span>
                      <span className="inline-flex items-center flex-1">
                        <span className="mr-1">(2)</span>
                        <CheckBox checked={Boolean(child?.isTuitionFee)} />
                        <span className="mr-1">จำนวน</span>
                        <span className="dotted-fill flex-1 text-right font-mono-nums font-semibold">
                          {child ? formatCurrency(child.amount) : ''}
                        </span>
                        <span className="ml-1">บาท</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2: Sections 5, 6, 7, 8 and คำชี้แจง matching image_b500e08c.png */}
        <div className="print-page page-break-before font-form-7131 bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-[12mm] shadow-xl border border-slate-200 text-[13px] leading-[1.68]">
          <div className="border-[1.5px] border-black">
            {/* Section 5 */}
            <div className="px-5 py-3.5 border-b-[1.5px] border-black space-y-2">
              <div className="font-semibold">
                5. ข้าพเจ้าขอรับเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร
              </div>
              <div className="pl-5 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-6">
                  <span className="inline-flex items-center">
                    <CheckBox checked={claim.entitlementBasis === 'full'} />
                    <span>ตามสิทธิ</span>
                  </span>
                  <span className="inline-flex items-baseline flex-1">
                    <CheckBox checked={claim.entitlementBasis === 'partial'} />
                    <span>เฉพาะส่วนที่ยังขาดจากสิทธิ เป็นเงิน</span>
                    <span className="dotted-fill flex-1 min-w-[100px] text-right font-mono-nums font-semibold ml-1.5 mr-1.5">
                      {formatCurrency(claim.claimableAmount)}
                    </span>
                    <span>บาท</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pl-2">
                  <span>(</span>
                  <span className="dotted-fill flex-1 text-center font-medium">
                    {claim.claimableAmountText}
                  </span>
                  <span>) ก.</span>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="px-5 py-4 border-b-[1.5px] border-black space-y-2.5">
              <div className="font-semibold">
                6. &nbsp;&nbsp;เสนอ {submittedTo}
              </div>

              <div className="pl-5 space-y-1.5 text-[12.5px]">
                <div className="flex items-start">
                  <CheckBox checked={Boolean(claim.certHasRight)} />
                  <span>
                    ข้าพเจ้ามีสิทธิได้รับเงินช่วยเหลือตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร และข้อความที่ระบุข้างต้นเป็นความจริง
                  </span>
                </div>
                <div className="flex items-start">
                  <CheckBox checked={Boolean(claim.certChildEligible)} />
                  <span>
                    บุตรของข้าพเจ้าอยู่ในข่ายได้รับความช่วยเหลือตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร
                  </span>
                </div>
                <div className="flex items-start">
                  <CheckBox checked={Boolean(claim.certSoleClaimant)} />
                  <span>
                    เป็นผู้ใช้สิทธิเบิกเงินช่วยเหลือตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการศึกษาของบุตรแต่เพียงฝ่ายเดียว
                  </span>
                </div>
                <div className="flex items-start">
                  <CheckBox checked={Boolean(claim.certSpouseLowerBenefit)} />
                  <span className="leading-relaxed">
                    คู่สมรสของข้าพเจ้าได้รับการช่วยเหลือจากรัฐวิสาหกิจ หน่วยงานของส่วนราชการ ราชการส่วนท้องถิ่น กรุงเทพมหานคร องค์กรอิสระ องค์การมหาชน หรือหน่วยงานอื่นใด ต่ำกว่าจำนวนที่ได้รับจากทางราชการ จำนวน{' '}
                    <span className="dotted-fill min-w-[110px] text-center font-mono-nums font-medium">
                      {claim.certSpouseLowerBenefit && Number(claim.spouseLowerAmount) > 0
                        ? formatCurrency(claim.spouseLowerAmount)
                        : ''}
                    </span>{' '}
                    บาท
                  </span>
                </div>
              </div>

              <div className="pl-12 pt-1 text-[12.5px]">
                ข้าพเจ้าขอรับรองว่ามีสิทธิเบิกได้ตามกฎหมาย ตามจำนวนที่ขอเบิก
              </div>

              <div className="pt-3 flex justify-end pr-4">
                <div className="w-[330px] space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="dotted-fill flex-1" />
                    <span className="whitespace-nowrap">ผู้ขอรับเงินสวัสดิการ</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1 pr-16">
                    <span>(</span>
                    <span className="dotted-fill min-w-[175px] text-center font-medium">
                      {claim.claimantName}
                    </span>
                    <span>)</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span>วันที่</span>
                    <span className="dotted-fill w-[40px] text-center font-medium">
                      {claimDateParts.day}
                    </span>
                    <span>เดือน</span>
                    <span className="dotted-fill w-[95px] text-center font-medium">
                      {claimDateParts.month}
                    </span>
                    <span>พ.ศ.</span>
                    <span className="dotted-fill w-[50px] text-center font-medium">
                      {claimDateParts.year}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7 */}
            <div className="px-5 py-4 border-b-[1.5px] border-black min-h-[145px] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="font-semibold">7. &nbsp;&nbsp;คำอนุมัติ</div>
                <div className="pl-24">อนุมัติให้เบิกได้</div>
              </div>
              <div className="pt-4 pb-1 flex justify-end pr-16">
                <div className="w-[260px] space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="dotted-fill flex-1" />
                  </div>
                  {claim.approverName && (
                    <div className="text-center text-[12px] text-slate-800 pl-8">
                      ({claim.approverName})
                    </div>
                  )}
                  {claim.approverPosition && (
                    <div className="text-center text-[12px] text-slate-800 pl-8">
                      ตำแหน่ง {claim.approverPosition}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 8 */}
            <div className="px-5 py-4 space-y-2.5">
              <div className="font-semibold">8. &nbsp;&nbsp;ใบรับเงิน</div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-1.5 pl-12">
                  <span>ได้รับเงินสวัสดิการเกี่ยวกับการศึกษาบุตร จำนวน</span>
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

              <div className="pt-3 flex justify-end pr-10">
                <div className="w-[290px] space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="dotted-fill flex-1" />
                    <span className="whitespace-nowrap">ผู้รับเงิน</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1 pr-10">
                    <span>(</span>
                    <span className="dotted-fill min-w-[175px] text-center font-medium">
                      {claim.claimantName}
                    </span>
                    <span>)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end pr-10">
                <div className="w-[310px] space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="dotted-fill flex-1" />
                    <span className="whitespace-nowrap">ผู้จ่ายเงิน</span>
                  </div>
                  <div className="text-center pr-6">
                    <span>({payerName})</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span>วันที่</span>
                    <span className="dotted-fill w-[45px]" />
                    <span>เดือน</span>
                    <span className="dotted-fill w-[95px]" />
                    <span>พ.ศ.</span>
                    <span className="dotted-fill w-[50px]" />
                  </div>
                  <div className="text-center text-[11.5px] pr-4">
                    (ลงชื่อต่อเมื่อได้รับเงินแล้วเท่านั้น)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* คำชี้แจง */}
          <div className="mt-4 px-2 space-y-1 text-[12px]">
            <div className="font-semibold">คำชี้แจง</div>
            <div className="pl-2">
              ก. ให้ระบุการมีสิทธิเพียงใด เมื่อเทียบกับสิทธิที่ได้รับตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร
            </div>
            <div className="pl-2">ข. ให้เสนอต่อผู้มีอำนาจอนุมัติ</div>
          </div>
        </div>

        {/* PAGE 3: Education Fee & Receipt Statement Attachment */}
        <div className="print-page page-break-before font-form-7131 bg-white text-black w-full max-w-[210mm] p-[14mm] shadow-xl border border-slate-200 text-[13px] leading-[1.6]">
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
            <div>
              <h2 className="text-[16px] font-bold">
                บัญชีรายละเอียดใบเสร็จรับเงินค่าการศึกษาของบุตรแนบท้าย แบบ 7223
              </h2>
              <p className="text-[12.5px]">
                เลขที่ใบเบิก: {claim.claimNumber} · ปีการศึกษา {claim.academicYear} (ภาคเรียนที่ {claim.semester}) · ผู้ขอเบิก: {claim.claimantName}
              </p>
            </div>
            <div className="text-right text-[12.5px]">
              <div>วันที่ยื่น: {formatThaiDate(claim.claimDate)}</div>
              <div>สังกัด: {claim.claimantAffiliation}</div>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[12.5px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black px-2 py-2 text-center w-10">ลำดับ</th>
                <th className="border border-black px-2 py-2 text-left">ชื่อ-สกุลบุตร</th>
                <th className="border border-black px-2 py-2 text-left">สถานศึกษา / ชั้นเรียน</th>
                <th className="border border-black px-2 py-2 text-left">ประเภทค่าใช้จ่าย</th>
                <th className="border border-black px-2 py-2 text-left w-28">เลขที่ใบเสร็จ</th>
                <th className="border border-black px-2 py-2 text-right w-28">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {[...claim.children, ...extraChildren.filter(() => false)].map((ch, idx) => {
                const feeTypes: string[] = [];
                if (ch.isMaintenanceFee) feeTypes.push('เงินบำรุงการศึกษา');
                if (ch.isTuitionFee) feeTypes.push('เงินค่าเล่าเรียน');
                return (
                  <tr key={ch.id ?? idx}>
                    <td className="border border-black px-2 py-1.5 text-center font-mono-nums">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-2 py-1.5">{ch.childName}</td>
                    <td className="border border-black px-2 py-1.5">
                      {ch.schoolName} ({ch.gradeLevel})
                    </td>
                    <td className="border border-black px-2 py-1.5">
                      {feeTypes.join(' และ ') || '-'}
                    </td>
                    <td className="border border-black px-2 py-1.5 font-mono-nums">
                      {ch.receiptNumber || '-'}
                    </td>
                    <td className="border border-black px-2 py-1.5 text-right font-mono-nums">
                      {formatCurrency(ch.amount)}
                    </td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-slate-50">
                <td colSpan={5} className="border border-black px-2.5 py-2 text-right">
                  รวมเงินค่าการศึกษาทั้งสิ้น ({claim.totalAmountText})
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
