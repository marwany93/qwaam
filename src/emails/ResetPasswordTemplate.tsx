import {
    Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
    userName: string;
    resetLink: string;
}

export const ResetPasswordTemplate = ({ userName, resetLink }: ResetPasswordEmailProps) => (
    <Html dir="rtl">
        <Head />
        <Preview>إعادة تعيين كلمة المرور - قوام</Preview>
        <Body style={{ backgroundColor: '#f9f9f9', fontFamily: 'sans-serif', padding: '20px' }}>
            <Container style={{ backgroundColor: '#ffffff', border: '1px solid #eee', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
                <Heading style={{ color: '#e91e63', textAlign: 'center' }}>قوام - Qwaam</Heading>
                <Section>
                    <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>أهلاً يا {userName}،</Text>
                    <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
                        لقد استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. إذا كنتِ أنتِ من طلبتِ ذلك، يرجى الضغط على الزر أدناه:
                    </Text>
                    <div style={{ textAlign: 'center', margin: '30px 0' }}>
                        <Button
                            href={resetLink}
                            style={{ backgroundColor: '#e91e63', color: '#fff', padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                            إعادة تعيين كلمة المرور
                        </Button>
                    </div>
                    <Text style={{ fontSize: '14px', color: '#888' }}>
                        هذا الرابط صالح لفترة محدودة. إذا لم تطلبي هذا التغيير، يمكنكِ تجاهل هذا الإيميل بأمان.
                    </Text>
                </Section>
                <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />
                <Text style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>فريق عمل قوام</Text>
            </Container>
        </Body>
    </Html>
);

export default ResetPasswordTemplate;