import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  FilePlus2,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  EducationClaim,
  MedicalClaim,
  ReportAnalytics,
  StaffProfile,
} from './types/medical';
import { DashboardReportsView } from './components/DashboardReportsView';
import { ClaimsRegistryView } from './components/ClaimsRegistryView';
import { ClaimForm7131Editor } from './components/ClaimForm7131Editor';
import { StaffDirectoryView } from './components/StaffDirectoryView';
import { Form7131PrintModal } from './components/Form7131PrintModal';
import { EducationClaimsRegistryView } from './components/EducationClaimsRegistryView';
import { EducationClaimForm7223Editor } from './components/EducationClaimForm7223Editor';
import { Form7223PrintModal } from './components/Form7223PrintModal';
import { ClaimDetailModal } from './components/ClaimDetailModal';
import { EducationClaimDetailModal } from './components/EducationClaimDetailModal';
import { GoogleSheetsStatusBar } from './components/GoogleSheetsStatusBar';

type ActiveTab =
  | 'dashboard'
  | 'claims'
  | 'new_claim'
  | 'edu_claims'
  | 'new_edu_claim'
  | 'staff';

function WorkspaceApp() {
  const {
    firebaseUser,
    dbUser,
    workspaceAccessToken,
    loading: authLoading,
    authError,
    signInWithGoogle,
    connectGoogleSheets,
    clearWorkspaceAccessToken,
    updateSheetSyncState,
    signOut,
    apiFetch,
    apiDownload,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [claims, setClaims] = useState<MedicalClaim[]>([]);
  const [educationClaims, setEducationClaims] = useState<EducationClaim[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [editingClaim, setEditingClaim] = useState<MedicalClaim | null>(null);
  const [detailClaim, setDetailClaim] = useState<MedicalClaim | null>(null);
  const [printingClaim, setPrintingClaim] = useState<MedicalClaim | null>(null);

  const [editingEduClaim, setEditingEduClaim] = useState<EducationClaim | null>(null);
  const [detailEduClaim, setDetailEduClaim] = useState<EducationClaim | null>(null);
  const [printingEduClaim, setPrintingEduClaim] = useState<EducationClaim | null>(null);

  const loadWorkspaceData = useCallback(
    async (year = selectedYear) => {
      if (!firebaseUser) return;
      setDataLoading(true);
      setDataError(null);
      try {
        const [staffRes, claimsRes, eduRes, reportRes] = await Promise.all([
          apiFetch<{ staff: StaffProfile[] }>('/api/staff'),
          apiFetch<{ claims: MedicalClaim[] }>('/api/claims'),
          apiFetch<{ claims: EducationClaim[] }>('/api/education-claims'),
          apiFetch<ReportAnalytics>(
            `/api/reports/summary${year !== 'all' ? `?fiscalYear=${encodeURIComponent(year)}` : ''}`
          ),
        ]);
        setStaffList(staffRes.staff);
        setClaims(claimsRes.claims);
        setEducationClaims(eduRes.claims);
        setAnalytics(reportRes);
      } catch (err: any) {
        setDataError(err?.message || 'ไม่สามารถโหลดข้อมูลจากฐานข้อมูลได้');
      } finally {
        setDataLoading(false);
      }
    },
    [firebaseUser, apiFetch, selectedYear]
  );

  useEffect(() => {
    if (firebaseUser && dbUser) {
      loadWorkspaceData(selectedYear);
    }
  }, [firebaseUser, dbUser, selectedYear, loadWorkspaceData]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setDataError(null);
    try {
      await apiFetch('/api/seed-demo', { method: 'POST' });
      await loadWorkspaceData(selectedYear);
    } catch (err: any) {
      setDataError(err?.message || 'ไม่สามารถนำเข้าข้อมูลตัวอย่างได้');
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadBackup = async (format: 'sql' | 'csv', table = 'all') => {
    setDataError(null);
    try {
      const params = new URLSearchParams({
        format,
        fiscalYear: selectedYear,
        table,
      });
      const fallbackExt = format === 'sql' ? 'sql' : 'csv';
      await apiDownload(
        `/api/backup/export?${params.toString()}`,
        `donphut_welfare_backup_${selectedYear}.${fallbackExt}`
      );
    } catch (err: any) {
      setDataError(err?.message || 'ไม่สามารถดาวน์โหลดไฟล์สำรองข้อมูลได้');
    }
  };

  // Form 7131 handlers
  const handleSaveClaim = async (payload: any, openPrintAfter: boolean) => {
    let saved: { claim: MedicalClaim };
    if (editingClaim) {
      saved = await apiFetch<{ claim: MedicalClaim }>(`/api/claims/${editingClaim.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      saved = await apiFetch<{ claim: MedicalClaim }>('/api/claims', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    setEditingClaim(null);
    await loadWorkspaceData(selectedYear);
    setActiveTab('claims');
    if (openPrintAfter) {
      setPrintingClaim(saved.claim);
    }
  };

  const handleDeleteClaim = async (claimId: number) => {
    try {
      await apiFetch(`/api/claims/${claimId}`, { method: 'DELETE' });
      await loadWorkspaceData(selectedYear);
    } catch (err: any) {
      setDataError(err?.message || 'ไม่สามารถลบใบเบิกแบบ 7131 ได้');
    }
  };

  const handleUpdateClaimStatus = async (claimId: number, payload: any) => {
    await apiFetch(`/api/claims/${claimId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    await loadWorkspaceData(selectedYear);
  };

  // Form 7223 handlers
  const handleSaveEduClaim = async (payload: any, openPrintAfter: boolean) => {
    let saved: { claim: EducationClaim };
    if (editingEduClaim) {
      saved = await apiFetch<{ claim: EducationClaim }>(
        `/api/education-claims/${editingEduClaim.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );
    } else {
      saved = await apiFetch<{ claim: EducationClaim }>('/api/education-claims', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    setEditingEduClaim(null);
    await loadWorkspaceData(selectedYear);
    setActiveTab('edu_claims');
    if (openPrintAfter) {
      setPrintingEduClaim(saved.claim);
    }
  };

  const handleDeleteEduClaim = async (claimId: number) => {
    try {
      await apiFetch(`/api/education-claims/${claimId}`, { method: 'DELETE' });
      await loadWorkspaceData(selectedYear);
    } catch (err: any) {
      setDataError(err?.message || 'ไม่สามารถลบใบเบิกแบบ 7223 ได้');
    }
  };

  const handleUpdateEduClaimStatus = async (claimId: number, payload: any) => {
    await apiFetch(`/api/education-claims/${claimId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    await loadWorkspaceData(selectedYear);
  };

  // Staff handlers
  const handleCreateStaff = async (data: any) => {
    await apiFetch('/api/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await loadWorkspaceData(selectedYear);
  };

  const handleUpdateStaff = async (id: number, data: any) => {
    await apiFetch(`/api/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await loadWorkspaceData(selectedYear);
  };

  const handleDeleteStaff = async (id: number) => {
    try {
      await apiFetch(`/api/staff/${id}`, { method: 'DELETE' });
      await loadWorkspaceData(selectedYear);
    } catch (err: any) {
      setDataError(err?.message || 'ไม่สามารถลบเจ้าหน้าที่ได้');
    }
  };

  const handleAddDependent = async (staffId: number, data: any) => {
    await apiFetch(`/api/staff/${staffId}/dependents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await loadWorkspaceData(selectedYear);
  };

  const handleDeleteDependent = async (depId: number) => {
    await apiFetch(`/api/dependents/${depId}`, { method: 'DELETE' });
    await loadWorkspaceData(selectedYear);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-600">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-7 p-8 sm:p-10 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700">
              <ShieldCheck className="w-4 h-4" />
              <span>สำนักงานสาธารณสุขอำเภอดอนพุด จังหวัดสระบุรี</span>
            </div>
            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                ระบบใบเบิกเงินสวัสดิการสำนักงานสาธารณสุขอำเภอดอนพุด
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                ระบบฐานข้อมูล SQL จัดเก็บข้อมูลเจ้าหน้าที่สาธารณสุขและครอบครัว
                สำหรับใบเบิกเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล (แบบ 7131)
                และใบเบิกเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร (แบบ 7223) พร้อมออกรายงานอัตโนมัติ
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs">
                {authError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg shadow-xs transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>Sign in with Google · เข้าสู่ระบบด้วย Google</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-5 bg-slate-900 text-slate-100 p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-semibold text-teal-400">
                ระบบงานสวัสดิการครบวงจร
              </div>
              <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <li>
                  01. ทะเบียนเจ้าหน้าที่สาธารณสุขอำเภอดอนพุดและบุคคลในครอบครัว (คู่สมรส บิดา มารดา บุตร) ในฐานข้อมูล SQL
                </li>
                <li>
                  02. ระบบใบเบิกเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล (แบบ 7131) พร้อมบัญชีใบเสร็จรับเงินแนบท้าย
                </li>
                <li>
                  03. ระบบใบเบิกเงินสวัสดิการเกี่ยวกับการศึกษาของบุตร (แบบ 7223) เชื่อมโยงข้อมูลบุตรและค่าเล่าเรียน
                </li>
                <li>
                  04. พิมพ์เอกสารราชการขนาด A4 และออกรายงานสรุปงบประมาณ/ไฟล์ CSV อัตโนมัติ
                </li>
              </ul>
            </div>
            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-4">
              มาตรฐานเอกสารกรมบัญชีกลาง · แบบ 7131 และ แบบ 7223
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'ภาพรวมและรายงาน',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'claims',
      label: 'รักษาพยาบาล (7131)',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'new_claim',
      label: 'ยื่นแบบ 7131 ใหม่',
      icon: <FilePlus2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'edu_claims',
      label: 'การศึกษาบุตร (7223)',
      icon: <GraduationCap className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'new_edu_claim',
      label: 'ยื่นแบบ 7223 ใหม่',
      icon: <Plus className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'staff',
      label: 'ข้อมูลเจ้าหน้าที่',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
  ];

  const pageTitleMap: Record<ActiveTab, string> = {
    dashboard: 'ภาพรวมสวัสดิการและรายงานอัตโนมัติ (แบบ 7131 และ 7223)',
    claims: 'ทะเบียนคุมใบเบิกค่ารักษาพยาบาล (แบบ 7131)',
    new_claim: editingClaim
      ? 'แก้ไขใบเบิกค่ารักษาพยาบาล (แบบ 7131)'
      : 'สร้างใบเบิกค่ารักษาพยาบาล (แบบ 7131)',
    edu_claims: 'ทะเบียนคุมใบเบิกค่าการศึกษาของบุตร (แบบ 7223)',
    new_edu_claim: editingEduClaim
      ? 'แก้ไขใบเบิกค่าการศึกษาของบุตร (แบบ 7223)'
      : 'สร้างใบเบิกค่าการศึกษาของบุตร (แบบ 7223)',
    staff: 'ทะเบียนเจ้าหน้าที่สาธารณสุขและครอบครัว',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:w-68 lg:flex-col bg-white border-r border-slate-200 shrink-0">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
            ระบบใบเบิกเงินสวัสดิการ
          </div>
          <div className="text-xs font-medium text-teal-700 mt-0.5 truncate">
            สำนักงานสาธารณสุขอำเภอดอนพุด
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'new_claim') setEditingClaim(null);
                  if (item.id === 'new_edu_claim') setEditingEduClaim(null);
                  setActiveTab(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="text-xs">
            <div className="font-semibold text-slate-900 truncate">
              {firebaseUser.displayName || dbUser?.displayName || 'เจ้าหน้าที่ผู้ใช้งาน'}
            </div>
            <div className="text-slate-500 truncate">{firebaseUser.email}</div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden bg-slate-900/50 flex">
          <div className="w-68 bg-white h-full flex flex-col border-r border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">ระบบใบเบิกเงินสวัสดิการ</div>
                <div className="text-[11px] text-teal-700">สสอ.ดอนพุด</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'new_claim') setEditingClaim(null);
                    if (item.id === 'new_edu_claim') setEditingEduClaim(null);
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium ${
                    activeTab === item.id
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={signOut}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print bg-white border-b border-slate-200 px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {pageTitleMap[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'edu_claims' || activeTab === 'new_edu_claim') {
                  setEditingEduClaim(null);
                  setActiveTab('new_edu_claim');
                } else {
                  setEditingClaim(null);
                  setActiveTab('new_claim');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'edu_claims' || activeTab === 'new_edu_claim'
                ? 'สร้างแบบ 7223'
                : 'สร้างแบบ 7131'}
            </button>
          </div>
        </header>

        <GoogleSheetsStatusBar
          dbUser={dbUser}
          workspaceAccessToken={workspaceAccessToken}
          staffList={staffList}
          claims={claims}
          educationClaims={educationClaims}
          onConnectSheets={connectGoogleSheets}
          onClearToken={clearWorkspaceAccessToken}
          onUpdateSyncState={updateSheetSyncState}
        />

        <main className="no-print flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          {dataError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-4">
              <span>{dataError}</span>
              <button
                type="button"
                onClick={() => setDataError(null)}
                className="text-red-700 font-semibold"
              >
                ปิด
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardReportsView
              analytics={analytics}
              claims={claims}
              educationClaims={educationClaims}
              selectedYear={selectedYear}
              onSelectYear={setSelectedYear}
              onOpenNewClaim={() => {
                setEditingClaim(null);
                setActiveTab('new_claim');
              }}
              onOpenNewEducationClaim={() => {
                setEditingEduClaim(null);
                setActiveTab('new_edu_claim');
              }}
              onPrintClaim={(claim) => setPrintingClaim(claim)}
              onPrintEducationClaim={(claim) => setPrintingEduClaim(claim)}
              onSeedDemo={handleSeedDemo}
              onDownloadBackup={handleDownloadBackup}
              seeding={seeding}
              loading={dataLoading}
            />
          )}

          {activeTab === 'claims' && (
            <ClaimsRegistryView
              claims={claims}
              onCreateNew={() => {
                setEditingClaim(null);
                setActiveTab('new_claim');
              }}
              onViewDetail={(claim) => setDetailClaim(claim)}
              onEditClaim={(claim) => {
                setEditingClaim(claim);
                setActiveTab('new_claim');
              }}
              onPrintClaim={(claim) => setPrintingClaim(claim)}
              onDeleteClaim={handleDeleteClaim}
              onUpdateStatus={handleUpdateClaimStatus}
            />
          )}

          {activeTab === 'new_claim' && (
            <ClaimForm7131Editor
              staffList={staffList}
              editingClaim={editingClaim}
              onCancel={() => {
                setEditingClaim(null);
                setActiveTab('claims');
              }}
              onSave={handleSaveClaim}
              onGoToStaff={() => setActiveTab('staff')}
            />
          )}

          {activeTab === 'edu_claims' && (
            <EducationClaimsRegistryView
              claims={educationClaims}
              onCreateNew={() => {
                setEditingEduClaim(null);
                setActiveTab('new_edu_claim');
              }}
              onViewDetail={(claim) => setDetailEduClaim(claim)}
              onEditClaim={(claim) => {
                setEditingEduClaim(claim);
                setActiveTab('new_edu_claim');
              }}
              onPrintClaim={(claim) => setPrintingEduClaim(claim)}
              onDeleteClaim={handleDeleteEduClaim}
              onUpdateStatus={handleUpdateEduClaimStatus}
            />
          )}

          {activeTab === 'new_edu_claim' && (
            <EducationClaimForm7223Editor
              staffList={staffList}
              editingClaim={editingEduClaim}
              onCancel={() => {
                setEditingEduClaim(null);
                setActiveTab('edu_claims');
              }}
              onSave={handleSaveEduClaim}
              onGoToStaff={() => setActiveTab('staff')}
            />
          )}

          {activeTab === 'staff' && (
            <StaffDirectoryView
              staffList={staffList}
              onCreateStaff={handleCreateStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
              onAddDependent={handleAddDependent}
              onDeleteDependent={handleDeleteDependent}
            />
          )}
        </main>
      </div>

      {detailClaim && (
        <ClaimDetailModal
          claim={detailClaim}
          onClose={() => setDetailClaim(null)}
          onEdit={(claim) => {
            setDetailClaim(null);
            setEditingClaim(claim);
            setActiveTab('new_claim');
          }}
          onOpenOfficialForm={(claim) => {
            setDetailClaim(null);
            setPrintingClaim(claim);
          }}
        />
      )}

      {detailEduClaim && (
        <EducationClaimDetailModal
          claim={detailEduClaim}
          onClose={() => setDetailEduClaim(null)}
          onEdit={(claim) => {
            setDetailEduClaim(null);
            setEditingEduClaim(claim);
            setActiveTab('new_edu_claim');
          }}
          onOpenOfficialForm={(claim) => {
            setDetailEduClaim(null);
            setPrintingEduClaim(claim);
          }}
        />
      )}

      {printingClaim && (
        <Form7131PrintModal
          claim={printingClaim}
          onClose={() => setPrintingClaim(null)}
        />
      )}

      {printingEduClaim && (
        <Form7223PrintModal
          claim={printingEduClaim}
          onClose={() => setPrintingEduClaim(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceApp />
    </AuthProvider>
  );
}
