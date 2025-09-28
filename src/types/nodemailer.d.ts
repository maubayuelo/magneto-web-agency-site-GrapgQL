declare module 'nodemailer' {
  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: { user: string; pass: string };
  }

  interface SendMailOptions {
    from?: string;
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<unknown>;
  }

  export function createTransport(options: TransportOptions): Transporter;
  const nodemailer: { createTransport: (options: TransportOptions) => Transporter };
  export default nodemailer;
}
