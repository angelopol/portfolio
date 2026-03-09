# Remote storage setup

## Supabase

1. Open the SQL editor in Supabase.
2. Run the SQL from `supabase/schema.sql`.
3. Copy these values into your environment:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - optional `SUPABASE_CONTENT_ROW_ID`

## AWS S3

Create a bucket for public assets and configure it for public reads.

Recommended values:
- `AWS_S3_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Optional values:
- `AWS_S3_PUBLIC_BASE_URL`
- `AWS_S3_KEY_PREFIX`

### Public visibility

This app uploads files to S3 with `ACL: public-read` and returns the public URL.

Your bucket must allow public objects for this to work correctly. If your AWS account enforces Bucket owner enforced object ownership, use a public bucket policy or a public CDN/domain in `AWS_S3_PUBLIC_BASE_URL`.

Notes:
- If `AWS_S3_PUBLIC_BASE_URL` is omitted, the app builds the URL automatically from bucket + region.
- If `AWS_S3_KEY_PREFIX` is omitted, the app uses `portfolio` by default.

Example public base URL:

- `https://my-bucket.s3.us-east-1.amazonaws.com`
- or your CDN/custom domain

## Fallback behavior

If Supabase or S3 env vars are missing, the app falls back to the local JSON/filesystem storage used in development.
