export interface PterodactylConfigStatus {
  configured: boolean;
  panelUrl: string | null;
  hasAppKey: boolean;
  hasClientKey: boolean;
  requiredEnvVars: string[];
}

export function getPterodactylStatus(): PterodactylConfigStatus {
  const rawUrl = process.env.PTERODACTYL_URL?.trim() || '';
  const appKey = process.env.PTERODACTYL_APP_API_KEY?.trim() || '';
  const clientKey = process.env.PTERODACTYL_CLIENT_API_KEY?.trim() || '';

  let validUrl: string | null = null;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      const isBlockedMetadata =
        host === '169.254.169.254' || host === 'metadata.google.internal' || host === '0.0.0.0';
      if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && !isBlockedMetadata) {
        validUrl = rawUrl.replace(/\/+$/, '');
      }
    } catch {
      validUrl = null;
    }
  }

  return {
    configured: Boolean(validUrl && appKey),
    panelUrl: validUrl,
    hasAppKey: Boolean(appKey),
    hasClientKey: Boolean(clientKey),
    requiredEnvVars: ['PTERODACTYL_URL', 'PTERODACTYL_APP_API_KEY', 'PTERODACTYL_CLIENT_API_KEY'],
  };
}

export async function fetchPterodactylAppServers(): Promise<{
  ok: boolean;
  status: number;
  servers?: unknown[];
  error?: string;
}> {
  const cfg = getPterodactylStatus();
  const appKey = process.env.PTERODACTYL_APP_API_KEY?.trim() || '';
  if (!cfg.configured || !cfg.panelUrl || !appKey) {
    return {
      ok: false,
      status: 503,
      error: 'Pterodactyl Panel credentials are not configured on the server.',
    };
  }

  try {
    const response = await fetch(`${cfg.panelUrl}/api/application/servers`, {
      headers: {
        Authorization: `Bearer ${appKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Pterodactyl Panel responded with HTTP ${response.status}.`,
      };
    }

    const payload = (await response.json()) as { data?: unknown[] };
    return {
      ok: true,
      status: 200,
      servers: Array.isArray(payload.data) ? payload.data : [],
    };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : 'Unable to reach Pterodactyl Panel.',
    };
  }
}

export async function fetchPterodactylServerResources(identifier: string): Promise<{
  ok: boolean;
  status: number;
  resources?: unknown;
  error?: string;
}> {
  const cfg = getPterodactylStatus();
  const clientKey = process.env.PTERODACTYL_CLIENT_API_KEY?.trim() || '';
  if (!cfg.panelUrl || !clientKey) {
    return {
      ok: false,
      status: 503,
      error: 'PTERODACTYL_CLIENT_API_KEY is not configured on the server.',
    };
  }

  const trimmedId = identifier.trim();
  if (!/^[a-zA-Z0-9_-]{4,48}$/.test(trimmedId)) {
    return { ok: false, status: 400, error: 'Invalid server identifier.' };
  }

  try {
    const response = await fetch(`${cfg.panelUrl}/api/client/servers/${trimmedId}/resources`, {
      headers: {
        Authorization: `Bearer ${clientKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Pterodactyl Client API responded with HTTP ${response.status}.`,
      };
    }

    const payload = (await response.json()) as { attributes?: unknown };
    return { ok: true, status: 200, resources: payload.attributes ?? payload };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : 'Unable to reach Pterodactyl Client API.',
    };
  }
}

export async function sendPterodactylPowerSignal(
  identifier: string,
  signal: 'start' | 'stop' | 'restart' | 'kill',
): Promise<{ ok: boolean; status: number; error?: string }> {
  const cfg = getPterodactylStatus();
  const clientKey = process.env.PTERODACTYL_CLIENT_API_KEY?.trim() || '';
  if (!cfg.panelUrl || !clientKey) {
    return {
      ok: false,
      status: 503,
      error: 'PTERODACTYL_CLIENT_API_KEY is not configured on the server.',
    };
  }

  const trimmedId = identifier.trim();
  if (!/^[a-zA-Z0-9_-]{4,48}$/.test(trimmedId)) {
    return { ok: false, status: 400, error: 'Invalid server identifier.' };
  }

  try {
    const response = await fetch(`${cfg.panelUrl}/api/client/servers/${trimmedId}/power`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ signal }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Pterodactyl power signal failed with HTTP ${response.status}.`,
      };
    }

    return { ok: true, status: 204 };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : 'Unable to send power signal.',
    };
  }
}
