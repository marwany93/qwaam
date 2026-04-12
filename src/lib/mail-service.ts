import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetPasswordEmail(email: string, resetLink: string, userName: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: `Qwaam <${process.env.NEXT_PUBLIC_FROM_EMAIL}>`,
            to: [email],
            subject: 'إعادة تعيين كلمة المرور - قوام',
            html: `
        <div dir="rtl" style="font-family: sans-serif; text-align: right;">
          <h2>أهلاً يا ${userName}،</h2>
          <p>لقد طلبتِ إعادة تعيين كلمة المرور الخاصة بحسابك في قوام.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #e91e63; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              إعادة تعيين كلمة المرور
            </a>
          </div>
          <p>إذا لم تطلبي هذا التغيير، يمكنك تجاهل هذا الإيميل.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">فريق قوام</p>
        </div>
      `,
        });

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error('Mail Error:', err);
        return { success: false, error: err };
    }
}