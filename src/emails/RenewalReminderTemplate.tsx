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

interface RenewalReminderProps {
  userName: string;
  /** Localized reminder body (interpolated with the end date by the caller). */
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

/**
 * Sent by the daily subscription-reminders cron to month-based Schedule
 * trainees whose period ends within 7 days. Copy is passed in already
 * localized (from the `schedule` i18n namespace) so this template stays dumb.
 */
export const RenewalReminderTemplate = ({ userName, body, ctaUrl, ctaLabel }: RenewalReminderProps) => (
  <Html dir="rtl">
    <Head />
    <Preview>{body}</Preview>
    <Body style={{ backgroundColor: '#f9f9f9', fontFamily: 'sans-serif', padding: '20px' }}>
      <Container style={{ backgroundColor: '#ffffff', border: '1px solid #eee', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <Heading style={{ color: '#e91e63', textAlign: 'center' }}>قوام - Qwaam</Heading>
        <Section>
          <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>أهلاً يا {userName}،</Text>
          <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>{body}</Text>
          {ctaUrl && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button
                href={ctaUrl}
                style={{ backgroundColor: '#e91e63', color: '#ffffff', padding: '12px 28px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px' }}
              >
                {ctaLabel ?? 'جدّد الآن'}
              </Button>
            </Section>
          )}
        </Section>
        <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />
        <Text style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>فريق عمل قوام</Text>
      </Container>
    </Body>
  </Html>
);

export default RenewalReminderTemplate;
