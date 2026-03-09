function createRemotePattern(url) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    return {
      protocol: parsedUrl.protocol.replace(":", ""),
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      pathname: `${parsedUrl.pathname.replace(/\/$/, "") || ""}/**`,
    };
  } catch {
    return null;
  }
}

const remotePatterns = [
  {
    protocol: "https",
    hostname: "**.amazonaws.com",
    pathname: "/**",
  },
];

const s3Bucket = process.env.AWS_S3_BUCKET;
const s3Region = process.env.AWS_S3_REGION;

if (s3Bucket && s3Region) {
  remotePatterns.push({
    protocol: "https",
    hostname: `${s3Bucket}.s3.${s3Region}.amazonaws.com`,
    pathname: "/**",
  });
}

const customPublicPattern = createRemotePattern(process.env.AWS_S3_PUBLIC_BASE_URL);

if (customPublicPattern) {
  remotePatterns.push(customPublicPattern);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
