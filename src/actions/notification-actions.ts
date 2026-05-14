"use server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNotification({ to, subject, template }: { to: string, subject: string, template: React.ReactNode }) {
    try {
        const { error } = await resend.emails.send({
            from: 'Qwaam <no-reply@qwaam.net>',
            to: [to],
            subject: subject,
            react: template,
        });
        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error("Notification Error:", err);
        return { success: false };
    }
}