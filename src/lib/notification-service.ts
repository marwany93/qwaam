import { sendNotification } from '@/actions/notification-actions';
import CoachAssignedTemplate from '@/emails/CoachAssignedTemplate';
import NewWorkoutTemplate from '@/emails/NewWorkoutTemplate';
import NewMessageTemplate from '@/emails/NewMessageTemplate';

export const notificationService = {
  /**
   * Notifies a trainee that a coach has been assigned to them.
   */
  notifyCoachAssigned: async (traineeEmail: string, traineeName: string, coachName: string) => {
    if (!traineeEmail) return;

    // Send asynchronously in the background
    sendNotification({
      to: traineeEmail,
      subject: 'لقد تم تعيين مدربتكِ! 🎉',
      template: CoachAssignedTemplate({ traineeName, coachName }),
    }).catch((err) => console.error('Failed to send coach assigned notification:', err));
  },

  /**
   * Notifies a trainee that a new workout plan has been added.
   */
  notifyNewWorkout: async (traineeEmail: string, traineeName: string) => {
    if (!traineeEmail) return;

    sendNotification({
      to: traineeEmail,
      subject: 'خطة تمارين جديدة بانتظاركِ! 💪',
      template: NewWorkoutTemplate({ traineeName }),
    }).catch((err) => console.error('Failed to send new workout notification:', err));
  },

  /**
   * Notifies a trainee about a new chat message.
   */
  notifyNewMessage: async (traineeEmail: string, traineeName: string, senderName: string) => {
    if (!traineeEmail) return;

    sendNotification({
      to: traineeEmail,
      subject: `رسالة جديدة من ${senderName} 💬`,
      template: NewMessageTemplate({ traineeName, senderName }),
    }).catch((err) => console.error('Failed to send new message notification:', err));
  }
};
