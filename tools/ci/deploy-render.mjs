const API_ORIGIN = 'https://api.render.com';
const POLL_INTERVAL_MS = 15_000;
const DEPLOY_TIMEOUT_MS = 15 * 60_000;
const SUCCESS_STATUS = 'live';
const FAILURE_STATUSES = new Set([
  'build_failed',
  'canceled',
  'deactivated',
  'deploy_failed',
  'failed',
  'pre_deploy_failed',
  'update_failed',
]);

const [serviceId, imageUrl] = process.argv.slice(2);
const apiKey = process.env.RENDER_API_KEY;

if (!serviceId || !imageUrl || !apiKey) {
  console.error(
    'Usage: RENDER_API_KEY=... node tools/ci/deploy-render.mjs <service-id> <image-url>',
  );
  process.exit(2);
}

const sleep = (durationMs) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

async function renderRequest(path, options = {}, attemptsRemaining = 4) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (
    (response.status === 429 || response.status >= 500) &&
    attemptsRemaining > 1
  ) {
    const retryNumber = 5 - attemptsRemaining;
    await sleep(2 ** retryNumber * 1_000);
    return renderRequest(path, options, attemptsRemaining - 1);
  }

  const bodyText = await response.text();
  const body = bodyText ? JSON.parse(bodyText) : {};
  if (!response.ok) {
    throw new Error(`Render API ${response.status}: ${bodyText}`);
  }

  return body;
}

async function deploy() {
  const created = await renderRequest(`/v1/services/${serviceId}/deploys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  const deployId = created.id ?? created.deploy?.id;
  if (!deployId) {
    throw new Error(
      'Render accepted the deployment but returned no deploy ID.',
    );
  }

  console.log(`Render deployment ${deployId} started for ${serviceId}.`);
  const deadline = Date.now() + DEPLOY_TIMEOUT_MS;
  let previousStatus;

  while (Date.now() < deadline) {
    const current = await renderRequest(
      `/v1/services/${serviceId}/deploys/${deployId}`,
    );
    const deployDetails = current.deploy ?? current;
    const { status } = deployDetails;

    if (status !== previousStatus) {
      console.log(`Render deployment ${deployId}: ${status}`);
      previousStatus = status;
    }
    if (status === SUCCESS_STATUS) return;
    if (FAILURE_STATUSES.has(status)) {
      throw new Error(
        `Render deployment ${deployId} ended with status ${status}.`,
      );
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Render deployment ${deployId} did not finish within 15 minutes.`,
  );
}

deploy().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
