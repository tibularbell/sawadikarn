const THAI_NUMBERS = [
  'ศูนย์',
  'หนึ่ง',
  'สอง',
  'สาม',
  'สี่',
  'ห้า',
  'หก',
  'เจ็ด',
  'แปด',
  'เก้า',
];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertIntegerToThai(numStr: string): string {
  if (numStr === '0' || /^0+$/.test(numStr)) return 'ศูนย์';

  // Handle numbers larger than 1 million recursively in chunks of 6 digits
  if (numStr.length > 6) {
    const overflow = numStr.slice(0, numStr.length - 6);
    const remainder = numStr.slice(numStr.length - 6);
    const remainderText = /^0+$/.test(remainder)
      ? ''
      : convertIntegerToThai(remainder.replace(/^0+/, '') || '0');
    return `${convertIntegerToThai(overflow)}ล้าน${remainderText}`;
  }

  let result = '';
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i], 10);
    const position = len - i - 1;
    if (digit === 0) continue;

    if (position === 1 && digit === 2) {
      result += 'ยี่สิบ';
    } else if (position === 1 && digit === 1) {
      result += 'สิบ';
    } else if (position === 0 && digit === 1 && len > 1 && numStr[len - 2] !== '0') {
      result += 'เอ็ด';
    } else if (position === 0 && digit === 1 && len > 1) {
      result += 'เอ็ด';
    } else {
      result += THAI_NUMBERS[digit] + THAI_UNITS[position];
    }
  }

  return result;
}

export function bahtText(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num) || num < 0) return 'ศูนย์บาทถ้วน';

  const fixed = num.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const cleanInt = intPart.replace(/^0+/, '') || '0';

  if (cleanInt === '0' && decPart === '00') {
    return 'ศูนย์บาทถ้วน';
  }

  let text = '';
  if (cleanInt !== '0') {
    text += `${convertIntegerToThai(cleanInt)}บาท`;
  }

  if (decPart === '00') {
    text += 'ถ้วน';
  } else {
    const cleanDec = decPart.replace(/^0+/, '') || '0';
    text += `${convertIntegerToThai(cleanDec)}สตางค์`;
  }

  return text;
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

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function formatThaiDate(dateStr?: string | null, short = false): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) {
    return dateStr;
  }
  const beYear = year > 2400 ? year : year + 543;
  const monthName = short ? THAI_MONTHS_SHORT[monthIdx] : THAI_MONTHS_FULL[monthIdx];
  return `${day} ${monthName} ${beYear}`;
}

export function getThaiFiscalYear(dateStr?: string): string {
  const now = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(now.getTime())) {
    return String(new Date().getFullYear() + 543);
  }
  const month = now.getMonth() + 1; // 1-12
  const ceYear = now.getFullYear();
  const fiscalCeYear = month >= 10 ? ceYear + 1 : ceYear;
  return String(fiscalCeYear + 543);
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0);
  if (Number.isNaN(num)) return '0.00';
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNationalId(id?: string | null): string {
  if (!id) return '-';
  const digits = id.replace(/\D/g, '');
  if (digits.length !== 13) return id;
  return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12, 13)}`;
}

export const PATIENT_TYPE_LABELS: Record<string, string> = {
  self: 'ตนเอง',
  spouse: 'คู่สมรส',
  father: 'บิดา',
  mother: 'มารดา',
  child: 'บุตร',
};

export const HOSPITAL_TYPE_LABELS: Record<string, string> = {
  public: 'สถานพยาบาลของทางราชการ',
  private: 'สถานพยาบาลเอกชน',
};

export const CLAIM_STATUS_LABELS: Record<string, string> = {
  draft: 'ฉบับร่าง',
  submitted: 'ยื่นเบิกแล้ว / รอตรวจสอบ',
  approved: 'อนุมัติให้เบิกได้',
  paid: 'เบิกจ่ายเรียบร้อย',
  rejected: 'ไม่อนุมัติ / ส่งคืนแก้ไข',
};

export const EXPENSE_CATEGORIES = [
  'ค่ายาและสารอาหารทางเส้นเลือด',
  'ค่าบริการทางการแพทย์ / ค่าตรวจรักษา',
  'ค่าตรวจวินิจฉัยทางห้องปฏิบัติการและรังสี',
  'ค่าห้องและค่าอาหาร',
  'ค่าอวัยวะเทียมและอุปกรณ์ทางการแพทย์',
  'ค่าหัตถการ / ค่าผ่าตัด / วิสัญญี',
  'ค่าบริการพยาบาลและเวชภัณฑ์มิใช่ยา',
];

export const SPOUSE_STATUS_LABELS: Record<string, string> = {
  not_gov: 'ไม่เป็นข้าราชการหรือลูกจ้างประจำ',
  gov_officer: 'เป็นข้าราชการ',
  permanent_employee: 'เป็นลูกจ้างประจำ',
  state_enterprise_or_other:
    'เป็นพนักงานหรือลูกจ้างในรัฐวิสาหกิจ / อปท. / องค์การมหาชน หรือหน่วยงานอื่น',
};

export const CLAIMANT_ROLE_LABELS: Record<string, string> = {
  lawful_father: 'เป็นบิดาชอบด้วยกฎหมาย',
  mother: 'เป็นมารดา',
};

export const EDUCATION_LEVEL_PRESETS = [
  'อนุบาล 1',
  'อนุบาล 2',
  'อนุบาล 3',
  'ประถมศึกษาปีที่ 1',
  'ประถมศึกษาปีที่ 2',
  'ประถมศึกษาปีที่ 3',
  'ประถมศึกษาปีที่ 4',
  'ประถมศึกษาปีที่ 5',
  'ประถมศึกษาปีที่ 6',
  'มัธยมศึกษาปีที่ 1',
  'มัธยมศึกษาปีที่ 2',
  'มัธยมศึกษาปีที่ 3',
  'มัธยมศึกษาปีที่ 4',
  'มัธยมศึกษาปีที่ 5',
  'มัธยมศึกษาปีที่ 6',
  'ปวช. ปีที่ 1',
  'ปวช. ปีที่ 2',
  'ปวช. ปีที่ 3',
  'ปวส. ปีที่ 1',
  'ปวส. ปีที่ 2',
  'ปริญญาตรี ปีที่ 1',
  'ปริญญาตรี ปีที่ 2',
  'ปริญญาตรี ปีที่ 3',
  'ปริญญาตรี ปีที่ 4',
];
