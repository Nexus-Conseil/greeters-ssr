import {
  buildAdminContactRequestBody,
  buildAuthorConfirmationRequestBody,
  type ContactPayload,
} from "../../greeters/lib/services/contact";

type ProbeInput = {
  payload?: Partial<ContactPayload>;
};

const rawArg = process.argv[2] ?? "{}";
const parsed = JSON.parse(rawArg) as ProbeInput;

const payload: ContactPayload = {
  name: parsed.payload?.name ?? "Marie Curie",
  email: parsed.payload?.email ?? "marie.curie@example.com",
  subject: parsed.payload?.subject ?? "Demande de balade à Montmartre",
  message:
    parsed.payload?.message ??
    "Bonjour,\nJe souhaite organiser une balade de 2h en petit groupe.\nMerci !",
};

const admin = buildAdminContactRequestBody(payload, {
  fromEmail: "contact@parisgreeters.org",
  fromName: "Paris Greeters",
  toEmail: "admin@parisgreeters.org",
  siteUrl: "https://parisgreeters.org",
});

const author = buildAuthorConfirmationRequestBody(payload, {
  fromEmail: "contact@parisgreeters.org",
  fromName: "Paris Greeters",
  siteUrl: "https://parisgreeters.org",
});

console.log(`JSON_RESULT::${JSON.stringify({ payload, admin, author })}`);