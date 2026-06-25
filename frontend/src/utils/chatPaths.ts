export function getChatPath(role: string | undefined, bookingId: string): string {
  switch (role) {
    case 'client':
      return `/client/chat/${bookingId}`;
    case 'driver':
      return `/driver/chat/${bookingId}`;
    case 'carwash':
      return `/carwash/chat/${bookingId}`;
    case 'admin':
    case 'subadmin':
      return `/admin/support-chat`;
    default:
      return `/client/chat/${bookingId}`;
  }
}

export function getMessagesInboxPath(role: string | undefined): string {
  switch (role) {
    case 'client':
      return '/client/messages';
    case 'driver':
      return '/driver/messages';
    case 'carwash':
      return '/carwash/messages';
    default:
      return '/client/messages';
  }
}
