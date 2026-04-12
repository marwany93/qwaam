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

interface NewWorkoutProps {
    traineeName: string;
}

export const NewWorkoutTemplate = ({ traineeName }: NewWorkoutProps) => (
    <Html dir="rtl">
        <Head />
        <Preview>لقد تم تخصيص جدول تمارينكِ الجديد!</Preview>
        <Body style={{ backgroundColor: '#f9f9f9', fontFamily: 'sans-serif', padding: '20px' }}>
            <Container style={{ backgroundColor: '#ffffff', border: '1px solid #eee', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
                <Heading style={{ color: '#e91e63', textAlign: 'center' }}>قوام - Qwaam</Heading>
                <Section>
                    <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>أهلاً وتألقاً يا {traineeName}، 💪</Text>
                    <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
                        نود إعلامكِ بأن مدربتكِ قد أضافت للتو <strong style={{ color: '#e91e63' }}>جدول تمارين جديد</strong> مخصص لكِ في بوابة المتدربة!
                    </Text>
                    <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
                        سجلي الدخول الآن عبر البوابة وتوكلي على الله لتبدأي في العمل على أهدافكِ:
                    </Text>
                    <div style={{ textAlign: 'center', margin: '30px 0' }}>
                        <Button
                            href={`${process.env.NEXT_PUBLIC_APP_URL}/login`}
                            style={{ backgroundColor: '#e91e63', color: '#fff', padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                            تصفح خطة التمارين
                        </Button>
                    </div>
                </Section>
                <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />
                <Text style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>فريق عمل قوام</Text>
            </Container>
        </Body>
    </Html>
);

export default NewWorkoutTemplate;
