/**
 * db_check.js - النسخة المصححة (ES Modules)
 * تم إصلاح خطأ قراءة سياسات RLS ليتوافق مع Supabase PostgreSQL
 */

import pg from 'pg';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة من ملف .env.local
dotenv.config({ path: '.env.local' });

const { Client } = pg;

// التحقق من وجود رابط قاعدة البيانات
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL or SUPABASE_DB_URL is missing. Provide it through the shell environment before running this script.');
  process.exit(1);
}

const TABLES_TO_CHECK = ['products', 'orders', 'prices', 'profiles'];

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    // ملاحظة: قد تحتاج لإلغاء التعليق عن السطر التالي إذا واجهت مشكلة في SSL مع Supabase
    ssl: { rejectUnauthorized: false } 
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully.');
    
    const report = {};

    // 1) فحص وجود الجداول
    const resTables = await client.query(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [TABLES_TO_CHECK]
    );
    const foundTables = resTables.rows.map(r => r.table_name);
    report.tables = [];
    for (const t of TABLES_TO_CHECK) {
      report.tables.push(foundTables.includes(t)
        ? { ok: true, message: `Table public.${t} exists` }
        : { ok: false, message: `Table public.${t} NOT found` });
    }

    // 2) فحص الأعمدة
    report.columns = [];
    for (const t of TABLES_TO_CHECK) {
      // نفحص فقط الجداول الموجودة
      if (!foundTables.includes(t)) continue;

      const colRes = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema='public' AND table_name = $1
         ORDER BY ordinal_position`,
        [t]
      );
      report.columns.push(colRes.rowCount === 0
        ? { ok: false, message: `No columns found for ${t} (table missing?)` }
        : { ok: true, message: `Columns for ${t} fetched`, details: colRes.rows });
    }

    // 3) فحص القيود (Primary Keys / Unique)
    const pkRes = await client.query(
      `SELECT tc.table_schema, tc.table_name, kcu.column_name, tc.constraint_type
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
       WHERE tc.table_schema = 'public'
         AND tc.table_name = ANY($1)
         AND tc.constraint_type IN ('PRIMARY KEY','UNIQUE')
       ORDER BY tc.table_name, kcu.ordinal_position`,
      [TABLES_TO_CHECK]
    );
    report.constraints = [{ ok: true, message: 'Primary/Unique constraints fetched', details: pkRes.rows }];

    // 4) فحص الدالة set_user_role
    const fnRes = await client.query(
      `SELECT n.nspname AS schema, p.proname AS function_name,
              pg_get_function_arguments(p.oid) AS arguments
       FROM pg_proc p
       JOIN pg_namespace n ON p.pronamespace = n.oid
       WHERE p.proname = 'set_user_role'`
    );
    report.rpc = fnRes.rowCount === 0
      ? [{ ok: false, message: 'Function set_user_role NOT found' }]
      : [{ ok: true, message: 'Function set_user_role found', details: fnRes.rows }];

    // 5) فحص الامتدادات (Extensions)
    const extRes = await client.query(`SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp','pgcrypto','uuid')`);
    report.extensions = [{ ok: true, message: 'Extensions fetched', details: extRes.rows }];

    // 6) حالة RLS (مفعلة أم لا)
    const rlsRes = await client.query(
      `SELECT relname AS table_name, relrowsecurity AS rls_enabled, relforcerowsecurity AS force_rls
       FROM pg_class
       WHERE relname = ANY($1)`,
      [TABLES_TO_CHECK]
    );
    report.rls = [{ ok: true, message: 'RLS status fetched', details: rlsRes.rows }];

    // 7) تفاصيل سياسات RLS (تم التصحيح هنا)
    const polRes = await client.query(
      `SELECT policyname, schemaname, tablename, cmd, qual, with_check
       FROM pg_policies
       WHERE schemaname = 'public' AND tablename = ANY($1)
       ORDER BY tablename, policyname`,
      [TABLES_TO_CHECK]
    );
    report.policies = [{ ok: true, message: 'Policies fetched', details: polRes.rows }];

    // 8) المفاتيح الأجنبية (Foreign Keys)
    const fkRes = await client.query(
      `SELECT conname, conrelid::regclass AS table_from, pg_get_constraintdef(oid) AS definition
       FROM pg_constraint
       WHERE conrelid::regclass::text LIKE 'public.%' AND contype = 'f'
       ORDER BY conrelid::regclass::text`
    );
    report.foreign_keys = [{ ok: true, message: 'Foreign keys fetched', details: fkRes.rows }];

    // 9) فحص الملفات الشخصية اليتيمة (Orphaned Profiles)
    // نتأكد أولاً من وجود جدول auth.users
    const authExists = await client.query(
      `SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
       WHERE n.nspname='auth' AND c.relname='users'`
    );
    if (authExists.rowCount > 0) {
      const orphanRes = await client.query(
        `SELECT p.id, p.email FROM public.profiles p LEFT JOIN auth.users u ON p.id = u.id WHERE u.id IS NULL LIMIT 50`
      );
      report.orphan_profiles = [{ ok: true, message: 'Orphaned profiles sample', details: orphanRes.rows }];
    } else {
      report.orphan_profiles = [{ ok: true, message: 'auth.users not found; skipped orphan check' }];
    }

    // 10) فحص صلاحية التنفيذ (Execution Privilege)
    // قد تفشل إذا لم يكن للمستخدم صلاحية الاستعلام عن الصلاحيات، لذا نضعها في try-catch بسيط
    try {
        const canExec = await client.query(
        `SELECT current_user AS executing_user,
                has_function_privilege(current_user, 'public.set_user_role()', 'EXECUTE') AS can_execute_set_user_role`
        );
        report.exec_check = [{ ok: true, message: 'Function execute privilege checked', details: canExec.rows }];
    } catch (e) {
        report.exec_check = [{ ok: false, message: 'Could not check function privilege (function might not exist)' }];
    }

    // 11) فحص karat = 0
    // نتأكد أن الجدول prices موجود
    if (foundTables.includes('prices')) {
        const karat0 = await client.query(`SELECT COUNT(*)::int AS count_karat_zero FROM public.prices WHERE karat = 0`);
        report.karat_zero = [{ ok: true, message: 'Count karat=0', details: karat0.rows[0] }];
    }

    // 12) عينات البيانات (Samples)
    const samples = {};
    for (const t of TABLES_TO_CHECK) {
      if (foundTables.includes(t)) {
        const s = await client.query(`SELECT * FROM public.${t} ORDER BY 1 DESC LIMIT 10`);
        samples[t] = s.rows;
      }
    }
    report.samples = [{ ok: true, message: 'Sample rows fetched', details: samples }];

    // --- طباعة التقرير النهائي ---
    console.log('\n==== DB Compatibility Check Report ====');
    for (const [section, items] of Object.entries(report)) {
      console.log(`\n-- ${section.toUpperCase()} --`);
      if (!items) continue;
      for (const it of items) {
        console.log(`${it.ok ? '✅ OK ' : '❌ FAIL'}: ${it.message}`);
        if (it.details) {
          const j = JSON.stringify(it.details, null, 2);
          console.log(j.length > 2000 ? j.slice(0, 2000) + '\n... (truncated)' : j);
        }
      }
    }
    console.log('\nReport complete. Review FAIL entries and details above.');

  } catch (err) {
    console.error('Error running checks:', err);
  } finally {
    await client.end();
  }
}

run();
