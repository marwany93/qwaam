import {
    Body,
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
  
  interface WelcomeEmailProps {
    userName: string;
  }
  
  export const WelcomeTemplate = ({ userName }: WelcomeEmailProps) => (
    <Html dir="rtl">
      <Head />
      <Preview>أهلاً بكِ في قوام</Preview>
      <Body style={{ backgroundColor: '#f9f9f9', fontFamily: 'sans-serif', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', border: '1px solid #eee', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <Heading style={{ color: '#e91e63', textAlign: 'center' }}>قوام - Qwaam</Heading>
          <Section>
            <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>أهلاً يا {userName}،</Text>
            <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
              يسعدنا انضمامكِ لعائلة قوام! لقد تم استلام بياناتكِ بنجاح وإنشاء حسابكِ.
            </Text>
            <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
              سيتم قريباً التواصل معكِ أو مراجعة بياناتك لتعيين الخطة المناسبة لكِ.
            </Text>
          </Section>
          <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />
          <Text style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>فريق عمل قوام</Text>
        </Container>
      </Body>
    </Html>
  );
  
  export default WelcomeTemplate;
