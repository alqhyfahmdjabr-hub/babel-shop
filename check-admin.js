// check-admin.js
// سكريبت لفحص صلاحيات المستخدم في قاعدة البيانات

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
 dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ خطأ: لم يتم العثور على متغيرات البيئة VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY");
    console.error("تأكد من وجود ملف .env.local في المجلد الرئيسي");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMyRole() {
    console.log("🔍 جاري الاتصال بقاعدة البيانات لفحص المستخدم...");

    const myEmail = "alqhyfahmdjabr@gmail.com";
    console.log(`... نبحث عن المستخدم صاحب الإيميل: ${myEmail}`);

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) {
            console.error("❌ حدث خطأ أثناء القراءة من قاعدة البيانات:");
            console.error(error.message);
            return;
        }

        console.log("✅ تم جلب البيانات! إليك قائمة المستخدمين المسجلين في جدول profiles:");
        console.table(data);

        const adminUser = data.find(user => user.role === 'admin');

        if (adminUser) {
            console.log(`\\n🎉 وجدنا مديراً! الـ ID الخاص به هو: ${adminUser.id}`);
        } else {
            console.log("\\n⚠️ لم يتم العثور على أي مستخدم برتبة 'admin' في هذا الجدول.");
        }
    } catch (err) {
        console.error("❌ خطأ غير متوقع:", err);
    }
}

checkMyRole();
