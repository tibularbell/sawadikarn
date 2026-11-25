import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { updateUserSheetSyncState } from './src/db/users.ts';
import {
  addStaffDependent,
  createEducationClaim,
  createMedicalClaim,
  createStaffProfile,
  deleteEducationClaim,
  deleteMedicalClaim,
  deleteStaffDependent,
  deleteStaffProfile,
  exportUserDatabaseBackup,
  getEducationClaimById,
  getMedicalClaimById,
  getReportAnalytics,
  listEducationClaims,
  listMedicalClaims,
  listStaffWithDependents,
  seedSamplePublicHealthData,
  updateEducationClaim,
  updateEducationClaimStatus,
  updateMedicalClaim,
  updateMedicalClaimStatus,
  updateStaffProfile,
} from './src/db/repository.ts';
import {
  buildBackupCsv,
  buildPostgresSqlDump,
  isValidBackupTable,
  type BackupTableName,
} from './src/lib/backup-serializer.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.dbUser });
  });

  app.patch('/api/sheets/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        googleSpreadsheetId,
        googleSpreadsheetTitle,
        googleSpreadsheetUrl,
        lastSheetSyncAt,
        lastSheetSyncStatus,
        lastSheetSyncError,
      } = req.body || {};

      const updated = await updateUserSheetSyncState(req.dbUser!.id, {
        googleSpreadsheetId,
        googleSpreadsheetTitle,
        googleSpreadsheetUrl,
        lastSheetSyncAt,
        lastSheetSyncStatus,
        lastSheetSyncError,
      });

      res.json({ user: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถบันทึกสถานะการซิงค์ได้' });
    }
  });

  app.post('/api/seed-demo', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await seedSamplePublicHealthData(req.dbUser!.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถสร้างข้อมูลตัวอย่างได้' });
    }
  });

  // Staff directory routes
  app.get('/api/staff', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await listStaffWithDependents(req.dbUser!.id);
      res.json({ staff: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลเจ้าหน้าที่' });
    }
  });

  app.post('/api/staff', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { staffCode, fullName, nationalId, position, affiliation } = req.body;
      if (!staffCode || !fullName || !nationalId || !position) {
        return res.status(400).json({
          error: 'กรุณากรอกรหัสเจ้าหน้าที่ ชื่อ-สกุล เลขบัตรประชาชน และตำแหน่งให้ครบถ้วน',
        });
      }
      const created = await createStaffProfile(req.dbUser!.id, {
        ...req.body,
        affiliation: affiliation || 'สำนักงานสาธารณสุขอำเภอดอนพุด',
      });
      res.status(201).json({ staff: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถเพิ่มเจ้าหน้าที่ได้' });
    }
  });

  app.put('/api/staff/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const staffId = Number(req.params.id);
      if (Number.isNaN(staffId)) {
        return res.status(400).json({ error: 'รหัสอ้างอิงไม่ถูกต้อง' });
      }
      const updated = await updateStaffProfile(req.dbUser!.id, staffId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลเจ้าหน้าที่' });
      }
      res.json({ staff: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถแก้ไขข้อมูลเจ้าหน้าที่ได้' });
    }
  });

  app.delete('/api/staff/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const staffId = Number(req.params.id);
      if (Number.isNaN(staffId)) {
        return res.status(400).json({ error: 'รหัสอ้างอิงไม่ถูกต้อง' });
      }
      const deleted = await deleteStaffProfile(req.dbUser!.id, staffId);
      if (!deleted) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลเจ้าหน้าที่' });
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error?.message === 'CONFLICT_CLAIMS_EXIST') {
        return res.status(409).json({
          error: 'ไม่สามารถลบเจ้าหน้าที่ที่มีประวัติใบเบิกแบบ 7131 หรือ 7223 ผูกอยู่ได้ กรุณาลบใบเบิกก่อน',
        });
      }
      res.status(500).json({ error: error.message || 'ไม่สามารถลบเจ้าหน้าที่ได้' });
    }
  });

  // Dependents routes
  app.post('/api/staff/:id/dependents', requireAuth, async (req: AuthRequest, res) => {
    try {
      const staffId = Number(req.params.id);
      const { relationship, fullName, nationalId } = req.body;
      if (Number.isNaN(staffId) || !relationship || !fullName || !nationalId) {
        return res.status(400).json({
          error: 'กรุณากรอกความสัมพันธ์ ชื่อ-สกุล และเลขบัตรประชาชนให้ครบถ้วน',
        });
      }
      const created = await addStaffDependent(req.dbUser!.id, staffId, req.body);
      if (!created) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลเจ้าหน้าที่ต้นสังกัด' });
      }
      res.status(201).json({ dependent: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถเพิ่มข้อมูลบุคคลในครอบครัวได้' });
    }
  });

  app.delete('/api/dependents/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dependentId = Number(req.params.id);
      if (Number.isNaN(dependentId)) {
        return res.status(400).json({ error: 'รหัสอ้างอิงไม่ถูกต้อง' });
      }
      const deleted = await deleteStaffDependent(req.dbUser!.id, dependentId);
      if (!deleted) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลบุคคลในครอบครัว' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถลบข้อมูลบุคคลในครอบครัวได้' });
    }
  });

  // Form 7131 Medical Claims routes
  app.get('/api/claims', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claims = await listMedicalClaims(req.dbUser!.id, {
        status: req.query.status as string | undefined,
        fiscalYear: req.query.fiscalYear as string | undefined,
        hospitalType: req.query.hospitalType as string | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ claims });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถโหลดรายการใบเบิกได้' });
    }
  });

  app.get('/api/claims/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claimId = Number(req.params.id);
      if (Number.isNaN(claimId)) {
        return res.status(400).json({ error: 'รหัสใบเบิกไม่ถูกต้อง' });
      }
      const claim = await getMedicalClaimById(req.dbUser!.id, claimId);
      if (!claim) {
        return res.status(404).json({ error: 'ไม่พบใบเบิกที่ต้องการ' });
      }
      res.json({ claim });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถโหลดข้อมูลใบเบิกได้' });
    }
  });

  app.post('/api/claims', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      if (!body.staffId || !body.diagnosis || !body.hospitalName || !body.claimDate) {
        return res.status(400).json({
          error: 'กรุณากรอกข้อมูลเจ้าหน้าที่ โรค สถานพยาบาล และวันที่ให้ครบถ้วน',
        });
      }
      const created = await createMedicalClaim(req.dbUser!.id, body);
      res.status(201).json({ claim: created });
    } catch (error: any) {
      if (error?.message === 'STAFF_NOT_FOUND') {
        return res.status(404).json({ error: 'ไม่พบข้อมูลเจ้าหน้าที่ที่ระบุ' });
      }
      res.status(500).json({ error: error.message || 'ไม่สามารถบันทึกใบเบิกได้' });
    }
  });

  app.put('/api/claims/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claimId = Number(req.params.id);
      if (Number.isNaN(claimId)) {
        return res.status(400).json({ error: 'รหัสใบเบิกไม่ถูกต้อง' });
      }
      const updated = await updateMedicalClaim(req.dbUser!.id, claimId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'ไม่พบใบเบิกที่ต้องการแก้ไข' });
      }
      res.json({ claim: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถแก้ไขใบเบิกได้' });
    }
  });

  app.patch('/api/claims/:id/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claimId = Number(req.params.id);
      if (Number.isNaN(claimId)) {
        return res.status(400).json({ error: 'รหัสใบเบิกไม่ถูกต้อง' });
      }
      const updated = await updateMedicalClaimStatus(req.dbUser!.id, claimId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'ไม่พบใบเบิกที่ต้องการอัปเดตสถานะ' });
      }
      res.json({ claim: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถอัปเดตสถานะใบเบิกได้' });
    }
  });

  app.delete('/api/claims/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claimId = Number(req.params.id);
      if (Number.isNaN(claimId)) {
        return res.status(400).json({ error: 'รหัสใบเบิกไม่ถูกต้อง' });
      }
      const deleted = await deleteMedicalClaim(req.dbUser!.id, claimId);
      if (!deleted) {
        return res.status(404).json({ error: 'ไม่พบใบเบิกที่ต้องการลบ' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถลบใบเบิกได้' });
    }
  });

  // Form 7223 Education Claims routes
  app.get('/api/education-claims', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claims = await listEducationClaims(req.dbUser!.id, {
        status: req.query.status as string | undefined,
        fiscalYear: req.query.fiscalYear as string | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ claims });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถโหลดรายการใบเบิกแบบ 7223 ได้' });
    }
  });

  app.get('/api/education-claims/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claimId = Number(req.params.id);
      if (Number.isNaN(claimId)) {
        return res.status(400).json({ error: 'รหัสใบเบิกไม่ถูกต้อง' });
      }
      const claim = await getEducationClaimById(req.dbUser!.id, claimId);
      if (!claim) {
        return res.status(404).json({ error: 'ไม่พบใบเบิกแบบ 7223 ที่ต้องการ' });
      }
      res.json({ claim });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถโหลดข้อมูลใบเบิกแบบ 7223 ได้' });
    }
  });

  app.post('/api/education-claims', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      if (!body.staffId || !body.claimDate || !Array.isArray(body.children) || body.children.length === 0) {
        return res.status(400).json({
          error: 'กรุณากรอกข้อมูลเจ้าหน้าที่ วันที่ และรายการบุตรที่ศึกษาอย่างน้อย 1 คน',
        });
      }
      const created = await createEducationClaim(req.dbUser!.id, body);
      res.status(201).json({ claim: created });
    } catch (error: any) {
      if (error?.message === 'STAFF_NOT_FOUND') {
        return res.status(404).json({ error: 'ไม่พบข้อมูลเจ้าหน้าที่ที่ระบุ' });
      }
      res.status(500).json({ error: error.message || 'ไม่สามารถบันทึกใบเบิกแบบ 7223 ได้' });
    }
  });

  app.put('/api/education-claims/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claimId = Number(req.params.id);
      if (Number.isNaN(claimId)) {
        return res.status(400).json({ error: 'รหัสใบเบิกไม่ถูกต้อง' });
      }
      const updated = await updateEducationClaim(req.dbUser!.id, claimId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'ไม่พบใบเบิกแบบ 7223 ที่ต้องการแก้ไข' });
      }
      res.json({ claim: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถแก้ไขใบเบิกแบบ 7223 ได้' });
    }
  });

  app.patch('/api/education-claims/:id/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claimId = Number(req.params.id);
      if (Number.isNaN(claimId)) {
        return res.status(400).json({ error: 'รหัสใบเบิกไม่ถูกต้อง' });
      }
      const updated = await updateEducationClaimStatus(req.dbUser!.id, claimId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'ไม่พบใบเบิกแบบ 7223 ที่ต้องการอัปเดตสถานะ' });
      }
      res.json({ claim: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถอัปเดตสถานะใบเบิกแบบ 7223 ได้' });
    }
  });

  app.delete('/api/education-claims/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const claimId = Number(req.params.id);
      if (Number.isNaN(claimId)) {
        return res.status(400).json({ error: 'รหัสใบเบิกไม่ถูกต้อง' });
      }
      const deleted = await deleteEducationClaim(req.dbUser!.id, claimId);
      if (!deleted) {
        return res.status(404).json({ error: 'ไม่พบใบเบิกแบบ 7223 ที่ต้องการลบ' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถลบใบเบิกแบบ 7223 ได้' });
    }
  });

  // Automated Reports & Analytics route
  app.get('/api/reports/summary', requireAuth, async (req: AuthRequest, res) => {
    try {
      const fiscalYear = req.query.fiscalYear as string | undefined;
      const report = await getReportAnalytics(req.dbUser!.id, fiscalYear);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถสร้างรายงานสรุปได้' });
    }
  });

  // Annual Database Backup Export route (SQL Dump / CSV)
  app.get('/api/backup/export', requireAuth, async (req: AuthRequest, res) => {
    try {
      const format = req.query.format === 'csv' ? 'csv' : 'sql';
      const fiscalYear = (req.query.fiscalYear as string | undefined) || 'all';
      const requestedTable = (req.query.table as string | undefined) || 'all';

      const backup = await exportUserDatabaseBackup(req.dbUser!.id, fiscalYear);
      const dateStamp = new Date().toISOString().slice(0, 10);
      const yearSuffix = fiscalYear && fiscalYear !== 'all' ? `FY${fiscalYear}` : 'ALL';

      if (format === 'sql') {
        const sqlDump = buildPostgresSqlDump(backup, fiscalYear);
        const filename = `donphut_welfare_backup_${yearSuffix}_${dateStamp}.sql`;
        res.setHeader('Content-Type', 'application/sql; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(sqlDump);
      }

      const tableKey: BackupTableName | 'all' =
        requestedTable !== 'all' && isValidBackupTable(requestedTable)
          ? requestedTable
          : 'all';
      const csvContent = buildBackupCsv(backup, tableKey);
      const tableSuffix = tableKey === 'all' ? 'all_tables' : tableKey;
      const filename = `donphut_welfare_${tableSuffix}_${yearSuffix}_${dateStamp}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'ไม่สามารถส่งออกข้อมูลสำรองได้' });
    }
  });

  // Vite / Static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
