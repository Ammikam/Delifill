export interface Messenger {
  sendPasswordReset(phone: string, token: string): Promise<void>;
}

// Development stand-in. A real SMS provider replaces this in Phase 13.
class ConsoleMessenger implements Messenger {
  async sendPasswordReset(phone: string, token: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No SMS provider configured');
    }
    console.log(`[dev messenger] password reset for ${phone}: ${token}`);
  }
}

export const messenger: Messenger = new ConsoleMessenger();