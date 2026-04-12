import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface NewMessageProps {
    traineeName: string;
    senderName: string;
}

export const NewMessageTemplate = ({ traineeName, senderName }: NewMessageProps) => (
    <Html dir="rtl">
        <Head />
        <Preview>رسالة جديدة بانتظاركِ!</Preview>
        <Body style={{ backgroundColor: '#f9f9f9', fontFamily: 'sans-serif', padding: '20px' }}>
            <Container style={{ backgroundColor: '#ffffff', border: '1px solid #eee', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
                <Heading style={{ color: '#e91e63', textAlign: 'center' }}>قوام - Qwaam</Heading>
                <Section>
                    <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>أهلاً وتألقاً يا {traineeName}، 💬</Text>
                    <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
                        نود إعلامكِ بأنكِ قد استلمتِ رسالة جديدة من <strong style={{ color: '#e91e63' }}>{senderName}</strong> عبر بوابة المتدربة!
                    </Text>
                    <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
                        سجلي الدخول الآن عبر البوابة لقراءة الرسالة والرد عليها:
                    </Text>
                    <div style={{ textAlign: 'center', margin: '30px 0' }}>
                        <Button
                            href={`${process.env.NEXT_PUBLIC_APP_URL}/login`}
                            style={{ backgroundColor: '#e91e63', color: '#fff', padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                            قراءة الرسالة الآن
                        </Button>
                    </div>
                </Section>
                <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />
                <Text style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>فريق عمل قوام</Text>
            </Container>
        </Body>
    </Html>
);

export default NewMessageTemplate;
