import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  RefreshCw,
  Settings2,
  X,
} from 'lucide-react';
import { SheetSyncStatePayload } from '../context/AuthContext';
import {
  extractSpreadsheetId,
  syncWelfareDataToGoogleSheets,
  verifySpreadsheetConnection,
} from '../lib/google-sheets';
import { EducationClaim, MedicalClaim, StaffProfile, UserProfile } from '../types/medical';

interface Props {
  dbUser: UserProfile | null;
  workspaceAccessToken: string | null;
  staffList: StaffProfile[];
  claims: MedicalClaim[];
  educationClaims: EducationClaim[];
  onConnectSheets: () => Promise<string | null>;
  onClearToken: () => void;
  onUpdateSyncState: (payload: SheetSyncStatePayload) => Promise<void>;
}

function formatThaiDateTime(isoStr?: string | null): string {
  if (!isoStr) return 'ยังไม่เคยซิงค์ข้อมูล';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return 'ยังไม่เคยซิงค์ข้อมูล';
  return date.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' น.';
}

export function GoogleSheetsStatusBar({
  dbUser,
  workspaceAccessToken,
  staffList,
  claims,
  educationClaims,
  onConnectSheets,
  onClearToken,
  onUpdateSyncState,
}: Props) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [modalMode, setModalMode] = useState<'sync' | 'config' | null>(null);

  const [targetType, setTargetType] = useState<'existing' | 'new'>('new');
  const [sheetInput, setSheetInput] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState(
    'สสอ.ดอนพุด - ระบบใบเบิกเงินสวัสดิการ (7131 และ 7223)'
  );
  const [modalFeedback, setModalFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (dbUser?.googleSpreadsheetId) {
      setTargetType('existing');
      setSheetInput(dbUser.googleSpreadsheetId);
    } else {
      setTargetType('new');
      setSheetInput('');
    }
  }, [dbUser?.googleSpreadsheetId]);

  const persistedStatus = dbUser?.lastSheetSyncStatus || 'idle';
  const displayStatus: 'idle' | 'syncing' | 'success' | 'error' = isSyncing
    ? 'syncing'
    : persistedStatus === 'success'
      ? 'success'
      : persistedStatus === 'error'
        ? 'error'
        : 'idle';

  const barClasses =
    displayStatus === 'success'
      ? 'bg-emerald-50 border-b border-emerald-200 text-emerald-950'
      : displayStatus === 'error'
        ? 'bg-red-50 border-b border-red-200 text-red-950'
        : displayStatus === 'syncing'
          ? 'bg-amber-50 border-b border-amber-200 text-amber-950'
          : 'bg-slate-100/90 border-b border-slate-200 text-slate-800';

  const handleConnect = async (): Promise<string | null> => {
    setIsConnecting(true);
    setModalFeedback(null);
    try {
      const token = await onConnectSheets();
      return token;
    } catch (err: any) {
      const msg =
        err?.code === 'auth/popup-closed-by-user'
          ? 'ยกเลิกการเชื่อมต่อบัญชี Google'
          : err?.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้';
      await onUpdateSyncState({
        lastSheetSyncStatus: 'error',
        lastSheetSyncError: msg,
      }).catch(() => {});
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenModal = async (mode: 'sync' | 'config') => {
    setModalFeedback(null);
    if (!workspaceAccessToken) {
      const token = await handleConnect();
      if (!token) return;
    }
    if (dbUser?.googleSpreadsheetId) {
      setTargetType('existing');
      setSheetInput(dbUser.googleSpreadsheetId);
    } else {
      setTargetType('new');
    }
    setModalMode(mode);
  };

  const handleVerifySheet = async () => {
    if (!workspaceAccessToken) {
      setModalFeedback({ type: 'error', text: 'กรุณาเชื่อมต่อ Google Sheets ก่อนตรวจสอบ' });
      return;
    }
    setModalFeedback(null);
    setIsSyncing(true);
    try {
      const meta = await verifySpreadsheetConnection(workspaceAccessToken, sheetInput);
      await onUpdateSyncState({
        googleSpreadsheetId: meta.spreadsheetId,
        googleSpreadsheetTitle: meta.title,
        googleSpreadsheetUrl: meta.url,
        lastSheetSyncStatus:
          dbUser?.lastSheetSyncStatus === 'success' ? 'success' : 'idle',
        lastSheetSyncError: '',
      });
      setSheetInput(meta.spreadsheetId);
      setModalFeedback({
        type: 'success',
        text: `เชื่อมต่อสเปรดชีต "${meta.title}" สำเร็จ (${meta.sheetTitles.length} แท็บ)`,
      });
    } catch (err: any) {
      const msg = err?.message || 'ไม่สามารถตรวจสอบไฟล์ Google Sheets ได้';
      if (msg.includes('หมดอายุ')) {
        onClearToken();
      }
      await onUpdateSyncState({
        lastSheetSyncStatus: 'error',
        lastSheetSyncError: msg,
      }).catch(() => {});
      setModalFeedback({ type: 'error', text: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfirmSync = async () => {
    let token = workspaceAccessToken;
    if (!token) {
      token = await handleConnect();
      if (!token) return;
    }

    if (targetType === 'existing' && !extractSpreadsheetId(sheetInput)) {
      setModalFeedback({
        type: 'error',
        text: 'กรุณาระบุ Spreadsheet ID หรือ URL ของ Google Sheets ที่ต้องการซิงค์',
      });
      return;
    }

    setIsSyncing(true);
    setModalFeedback(null);
    try {
      const result = await syncWelfareDataToGoogleSheets({
        accessToken: token,
        spreadsheetId: targetType === 'existing' ? sheetInput : undefined,
        newSpreadsheetTitle: targetType === 'new' ? newSheetTitle.trim() : undefined,
        staffList,
        claims,
        educationClaims,
      });

      await onUpdateSyncState({
        googleSpreadsheetId: result.spreadsheetId,
        googleSpreadsheetTitle: result.spreadsheetTitle,
        googleSpreadsheetUrl: result.spreadsheetUrl,
        lastSheetSyncAt: result.syncedAt,
        lastSheetSyncStatus: 'success',
        lastSheetSyncError: '',
      });
      setModalMode(null);
    } catch (err: any) {
      const msg = err?.message || 'เกิดข้อผิดพลาดระหว่างการซิงค์ข้อมูลไปยัง Google Sheets';
      if (msg.includes('หมดอายุ')) {
        onClearToken();
      }
      await onUpdateSyncState({
        lastSheetSyncStatus: 'error',
        lastSheetSyncError: msg,
      }).catch(() => {});
      setModalFeedback({ type: 'error', text: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Persistent Top Status Bar across every screen */}
      <div
        role="status"
        aria-live="polite"
        className={`no-print px-5 sm:px-8 py-2.5 text-xs transition-colors ${barClasses}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Left: Connection + Sync State + Error or Spreadsheet Link */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            {displayStatus === 'success' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-semibold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ซิงค์สำเร็จ
              </span>
            )}
            {displayStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-600 text-white font-semibold shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
                เกิดข้อผิดพลาด
              </span>
            )}
            {displayStatus === 'syncing' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-600 text-white font-semibold shrink-0">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                กำลังซิงค์ข้อมูล
              </span>
            )}
            {displayStatus === 'idle' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 font-semibold shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {workspaceAccessToken ? 'เชื่อมต่อ Google Sheets แล้ว' : 'รอเชื่อมต่อ Google Sheets'}
              </span>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              <span className="font-medium">
                สถานะ Google Sheets:{' '}
                <span className="font-semibold">
                  {workspaceAccessToken ? 'เชื่อมต่อบัญชีแล้ว' : 'ยังไม่ได้เชื่อมต่อสิทธิ์ในเซสชันนี้'}
                </span>
              </span>

              {dbUser?.googleSpreadsheetId && (
                <>
                  <span className="text-slate-400">·</span>
                  <a
                    href={
                      dbUser.googleSpreadsheetUrl ||
                      `https://docs.google.com/spreadsheets/d/${dbUser.googleSpreadsheetId}/edit`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline font-medium truncate max-w-[240px] hover:opacity-80"
                    title={dbUser.googleSpreadsheetTitle || dbUser.googleSpreadsheetId}
                  >
                    <span className="truncate">
                      {dbUser.googleSpreadsheetTitle || 'เปิดสเปรดชีต'}
                    </span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </>
              )}

              {displayStatus === 'error' && dbUser?.lastSheetSyncError && (
                <>
                  <span className="text-red-300">·</span>
                  <span className="text-red-800 font-medium truncate max-w-[360px]">
                    {dbUser.lastSheetSyncError}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Last Sync Time + Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span className="text-[11.5px] font-mono-nums opacity-90">
              ซิงค์ล่าสุด: {formatThaiDateTime(dbUser?.lastSheetSyncAt)}
            </span>

            {!workspaceAccessToken && (
              <button
                type="button"
                disabled={isConnecting || isSyncing}
                onClick={handleConnect}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium transition-colors whitespace-nowrap"
              >
                <Link2 className="w-3.5 h-3.5 text-teal-700" />
                {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Google Sheets'}
              </button>
            )}

            <button
              type="button"
              disabled={isConnecting || isSyncing}
              onClick={() => handleOpenModal('sync')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                displayStatus === 'error'
                  ? 'bg-red-700 hover:bg-red-800 text-white'
                  : displayStatus === 'success'
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-teal-700 hover:bg-teal-800 text-white'
              } disabled:opacity-60`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ Google Sheets'}
            </button>

            <button
              type="button"
              disabled={isConnecting || isSyncing}
              onClick={() => handleOpenModal('config')}
              title="ตั้งค่าสเปรดชีต Google Sheets"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors whitespace-nowrap"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>ตั้งค่าชีต</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation & Spreadsheet Configuration Modal */}
      {modalMode && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {modalMode === 'sync'
                      ? 'ยืนยันการซิงค์ข้อมูลไปยัง Google Sheets'
                      : 'ตั้งค่าสเปรดชีต Google Sheets'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    เชื่อมโยงข้อมูลทะเบียนเจ้าหน้าที่ แบบ 7131 และ แบบ 7223
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {modalFeedback && (
                <div
                  className={`p-3 rounded-lg border flex items-start gap-2 ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  )}
                  <span>{modalFeedback.text}</span>
                </div>
              )}

              {/* Target Spreadsheet Selection */}
              <div className="space-y-2.5">
                <label className="block font-semibold text-slate-800">
                  เลือกสเปรดชีตปลายทาง
                </label>

                <label className="flex items-start gap-2.5 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="sheetTarget"
                    checked={targetType === 'existing'}
                    onChange={() => setTargetType('existing')}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="font-medium text-slate-900">
                      อัปเดตลงสเปรดชีตที่มีอยู่แล้ว (เขียนทับแท็บข้อมูลเดิม)
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sheetInput}
                        onChange={(e) => setSheetInput(e.target.value)}
                        onFocus={() => setTargetType('existing')}
                        placeholder="วาง URL หรือ Spreadsheet ID ของ Google Sheets..."
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-teal-600 font-mono-nums"
                      />
                      <button
                        type="button"
                        disabled={isSyncing || !sheetInput.trim()}
                        onClick={handleVerifySheet}
                        className="px-3 py-1.5 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-md font-medium text-slate-700 whitespace-nowrap"
                      >
                        ตรวจสอบ
                      </button>
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="sheetTarget"
                    checked={targetType === 'new'}
                    onChange={() => setTargetType('new')}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="font-medium text-slate-900">
                      สร้างไฟล์ Google Sheets ใหม่ในบัญชีของคุณ
                    </div>
                    <input
                      type="text"
                      value={newSheetTitle}
                      onChange={(e) => setNewSheetTitle(e.target.value)}
                      onFocus={() => setTargetType('new')}
                      placeholder="ชื่อไฟล์ Google Sheets ใหม่"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </label>
              </div>

              {/* Explicit Confirmation Scope Description */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 space-y-1.5 text-slate-700">
                <div className="font-semibold text-amber-900">
                  รายการข้อมูลที่จะซิงค์และเขียนทับลงในสเปรดชีต:
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    แท็บ <span className="font-semibold">ทะเบียนเจ้าหน้าที่</span> :{' '}
                    <span className="font-mono-nums font-semibold">{staffList.length}</span> รายการ
                  </li>
                  <li>
                    แท็บ <span className="font-semibold">แบบ7131_รักษาพยาบาล</span> :{' '}
                    <span className="font-mono-nums font-semibold">{claims.length}</span> ฉบับ
                  </li>
                  <li>
                    แท็บ <span className="font-semibold">แบบ7223_การศึกษาบุตร</span> :{' '}
                    <span className="font-mono-nums font-semibold">{educationClaims.length}</span> ฉบับ
                  </li>
                </ul>
                <p className="text-[11px] text-amber-800 pt-1">
                  หมายเหตุ: ระบบจะล้างข้อมูลเก่าเฉพาะใน 3 แท็บข้างต้นแล้วเขียนข้อมูลล่าสุดจากฐานข้อมูลลงไปแทนที่ทั้งหมด
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleConfirmSync}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white rounded-lg font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'ยืนยันซิงค์ข้อมูล'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
