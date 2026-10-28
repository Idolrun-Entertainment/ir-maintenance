import { v3 } from "@google-cloud/translate"
import { getVercelOidcToken } from "@vercel/oidc"
import { ExternalAccountClient } from "google-auth-library"

import { PermanentTranslationError, type Translator } from "./types"

const REQUEST_TIMEOUT_MS = 60_000

function required(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new PermanentTranslationError(`${name} is not set`)
  }

  return value
}

/**
 * Credentials, in order of preference - never a service account key:
 *  1. Workload Identity Federation using the Vercel OIDC token (production on
 *     Vercel; all GCP_WORKLOAD_IDENTITY_* / GCP_SERVICE_ACCOUNT_EMAIL set).
 *  2. Application Default Credentials (`gcloud auth application-default login`
 *     locally, or an attached service account on GCP).
 */
function createClient(): { client: v3.TranslationServiceClient; parent: string } {
  const projectId = required("GCP_PROJECT_ID")
  const location = process.env.GCP_TRANSLATE_LOCATION || "global"
  const parent = `projects/${projectId}/locations/${location}`

  if (process.env.GCP_WORKLOAD_IDENTITY_POOL_ID) {
    const authClient = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience:
        `//iam.googleapis.com/projects/${required("GCP_PROJECT_NUMBER")}` +
        `/locations/global/workloadIdentityPools/${required("GCP_WORKLOAD_IDENTITY_POOL_ID")}` +
        `/providers/${required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID")}`,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url:
        "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" +
        `${required("GCP_SERVICE_ACCOUNT_EMAIL")}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
    })

    if (!authClient) {
      throw new PermanentTranslationError("Invalid workload identity configuration")
    }

    return { client: new v3.TranslationServiceClient({ authClient, projectId }), parent }
  }

  return { client: new v3.TranslationServiceClient({ projectId }), parent }
}

export function createGoogleTranslator(): Translator {
  let cached: ReturnType<typeof createClient> | undefined

  return {
    async translateHtml(texts, targetGoogleCode) {
      cached ??= createClient()

      const [response] = await cached.client.translateText(
        {
          parent: cached.parent,
          contents: texts,
          mimeType: "text/html",
          sourceLanguageCode: "en",
          targetLanguageCode: targetGoogleCode,
        },
        { timeout: REQUEST_TIMEOUT_MS },
      )

      return (response.translations ?? []).map((t) => t.translatedText ?? "")
    },
  }
}
