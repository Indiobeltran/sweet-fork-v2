type InquiryRequestOriginEnv = Partial<Record<
  | "DEPLOY_PRIME_URL"
  | "DEPLOY_URL"
  | "NETLIFY"
  | "NEXT_PUBLIC_SITE_URL"
  | "NODE_ENV"
  | "SITE_NAME"
  | "URL",
  string | undefined
>>;

const productionOrigins = [
  "https://www.thesweetfork.com",
  "https://thesweetfork.com",
] as const;

const localOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

function addUrlOrigin(origins: Set<string>, value?: string | null) {
  if (!value) {
    return;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  origins.add(url.origin);

  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    origins.add(`https://${url.host}`);
  }
}

function addNetlifySiteOrigins(origins: Set<string>, env: InquiryRequestOriginEnv) {
  const siteName = env.SITE_NAME?.trim();

  if (!siteName || !/^[a-z0-9-]+$/i.test(siteName)) {
    return;
  }

  origins.add(`https://${siteName}.netlify.app`);
  origins.add(`https://main--${siteName}.netlify.app`);
}

export function getAllowedInquiryRequestOrigins({
  requestUrl,
  env = process.env,
}: {
  requestUrl: string;
  env?: InquiryRequestOriginEnv;
}) {
  const origins = new Set<string>();

  addUrlOrigin(origins, requestUrl);
  addUrlOrigin(origins, env.NEXT_PUBLIC_SITE_URL);
  addUrlOrigin(origins, env.URL);
  addUrlOrigin(origins, env.DEPLOY_URL);
  addUrlOrigin(origins, env.DEPLOY_PRIME_URL);
  addNetlifySiteOrigins(origins, env);

  productionOrigins.forEach((origin) => origins.add(origin));

  if (env.NODE_ENV !== "production") {
    localOrigins.forEach((origin) => origins.add(origin));
  }

  return origins;
}

export function isAllowedInquiryRequestOrigin({
  originHeader,
  requestUrl,
  env = process.env,
}: {
  originHeader: string | null;
  requestUrl: string;
  env?: InquiryRequestOriginEnv;
}) {
  if (!originHeader) {
    return true;
  }

  let origin: URL;

  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }

  return getAllowedInquiryRequestOrigins({ requestUrl, env }).has(origin.origin);
}
