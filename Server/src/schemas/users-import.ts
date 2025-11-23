import { z } from "zod";

export const importUserCsvRowSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "SOCIO"]).optional().default("SOCIO"),
});

export type ImportUserCsvRow = z.infer<typeof importUserCsvRowSchema>;

