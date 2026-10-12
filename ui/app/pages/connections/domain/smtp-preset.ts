export interface SmtpServer {
  host: string;
  port: number;
  secure: boolean;
}

const PRESETS: { domains: string[]; server: SmtpServer }[] = [
  {
    domains: ["gmail.com", "googlemail.com"],
    server: { host: "smtp.gmail.com", port: 465, secure: true },
  },
  {
    domains: ["outlook.com", "hotmail.com", "live.com", "msn.com"],
    server: { host: "smtp-mail.outlook.com", port: 587, secure: false },
  },
  {
    domains: ["icloud.com", "me.com", "mac.com"],
    server: { host: "smtp.mail.me.com", port: 587, secure: false },
  },
  {
    domains: ["yahoo.com", "yahoo.com.br"],
    server: { host: "smtp.mail.yahoo.com", port: 465, secure: true },
  },
];

/** The mail server of well-known providers, guessed from the address. */
export function smtpPresetFor(address: string): SmtpServer | null {
  const domain = address.trim().toLowerCase().split("@")[1];
  if (!domain) return null;
  return PRESETS.find((p) => p.domains.includes(domain))?.server ?? null;
}
