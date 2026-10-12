import { describe, expect, it } from "vitest";

import { smtpPresetFor } from "./smtp-preset";

describe("smtpPresetFor", () => {
  it("knows the server of common providers", () => {
    expect(smtpPresetFor(" Ana@Gmail.com ")).toEqual({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    });
    expect(smtpPresetFor("bia@hotmail.com")?.host).toBe(
      "smtp-mail.outlook.com",
    );
  });

  it("leaves other domains and half-typed addresses to the person", () => {
    expect(smtpPresetFor("ana@mycompany.com")).toBeNull();
    expect(smtpPresetFor("ana")).toBeNull();
  });
});
