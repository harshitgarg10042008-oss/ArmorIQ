function storageConfig() {
  const forgeUrl = String(process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!forgeUrl || !forgeKey) throw new Error("Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY");
  return { forgeUrl, forgeKey };
}

function withSuffix(relKey) {
  const key = String(relKey).replace(/^\/+/, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const dot = key.lastIndexOf(".");
  return dot < 0 ? `${key}_${suffix}` : `${key.slice(0, dot)}_${suffix}${key.slice(dot)}`;
}

export async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = storageConfig();
  const key = withSuffix(relKey);
  const presignUrl = new URL("v1/storage/presign/put", `${forgeUrl}/`);
  presignUrl.searchParams.set("path", key);
  const presign = await fetch(presignUrl, { headers: { Authorization: `Bearer ${forgeKey}` } });
  if (!presign.ok) throw new Error(`Storage presign failed (${presign.status})`);
  const { url } = await presign.json();
  if (!url) throw new Error("Forge returned empty presign URL");
  const upload = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: data });
  if (!upload.ok) throw new Error(`Storage upload to S3 failed (${upload.status})`);
  return { key, url: `/manus-storage/${key}` };
}
