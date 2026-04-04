import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// إجبار Vercel على تشغيله كـ API ديناميكي
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getAdminDb();
        const auth = getAdminAuth();

        // هنجيب كل اليوزرز اللي في جدول users
        const snapshot = await db.collection('users').get();
        let syncedCount = 0;

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const role = userData.role;

            // لو اليوزر ليه Role، هنحطها في الـ Custom Claims بتاعته
            if (role) {
                await auth.setCustomUserClaims(doc.id, { role: role });
                syncedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `تم ختم الكارنيهات بنجاح! تم تحديث صلاحيات ${syncedCount} مستخدم.`
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}