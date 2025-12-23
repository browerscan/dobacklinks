import {
  _Object,
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const createR2Client = () =>
  new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

export interface UploadOptions {
  data: Buffer | string;
  contentType: string;
  path?: string;
  key: string;
}
export interface UploadResult {
  url: string;
  key: string;
}

export const serverUploadFile = async ({
  data,
  contentType,
  path = "",
  key,
}: UploadOptions): Promise<UploadResult> => {
  if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    throw new Error("R2 configuration is missing");
  }

  const s3Client = createR2Client();
  const fileBuffer = Buffer.isBuffer(data)
    ? data
    : Buffer.from(data.replace(/^data:.*?;base64,/, ""), "base64");

  const finalKey = path
    ? path.endsWith("/")
      ? `${path}${key}`
      : `${path}/${key}`
    : key;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: finalKey,
        Body: fileBuffer,
        ContentType: contentType,
      }),
    );

    const url = `${process.env.R2_PUBLIC_URL}/${finalKey}`;

    return { url, key };
  } catch (error) {
    console.error("Failed to upload file to R2:", error);
    throw new Error("Failed to upload file to R2");
  }
};

export const deleteFile = async (key: string): Promise<void> => {
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error("R2 configuration is missing");
  }

  const s3Client = createR2Client();

  try {
    if (key.startsWith("/")) {
      key = key.slice(1);
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch (error) {
    console.error("Failed to delete file from R2:", error);
    throw new Error("Failed to delete file from R2");
  }
};

export interface ListedObject {
  key: string;
  url: string;
  lastModified?: Date;
  size?: number;
}
export interface ListR2ObjectsParams {
  prefix?: string;
  continuationToken?: string;
  pageSize?: number;
}
export interface ListR2ObjectsResult {
  objects: ListedObject[];
  nextContinuationToken?: string;
  error?: string;
}
export const listR2Objects = async (
  params: ListR2ObjectsParams,
): Promise<ListR2ObjectsResult> => {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket) {
    console.error("R2_BUCKET_NAME environment variable is not set.");
    return {
      objects: [],
      error: "Server configuration error: R2 bucket name not set.",
    };
  }
  if (!publicUrl) {
    console.error("R2_PUBLIC_URL environment variable is not set.");
    return {
      objects: [],
      error: "Server configuration error: R2 public URL not set.",
    };
  }

  const s3Client = createR2Client();

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: params.prefix,
      MaxKeys: params.pageSize,
      ContinuationToken: params.continuationToken,
    });

    const response = await s3Client.send(command);

    const listedObjects: ListedObject[] = (response.Contents || []).map(
      (obj: _Object) => ({
        key: obj.Key ?? "unknown-key",
        url: `${publicUrl}/${obj.Key}`,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ?? new Date(0),
      }),
    );

    return {
      objects: listedObjects,
      nextContinuationToken: response.NextContinuationToken,
    };
  } catch (error: any) {
    console.error("Failed to list objects from R2:", error);
    return {
      objects: [],
      error: `Failed to list objects: ${error.message || "Unknown R2 error"}`,
    };
  }
};

export const generateR2Key = ({
  fileName,
  path = "",
  prefix,
}: {
  fileName: string;
  path?: string;
  prefix?: string;
}): string => {
  const originalFileExtension = fileName.split(".").pop();
  const randomPart = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(
      2,
      8,
    )}${originalFileExtension ? `.${originalFileExtension}` : ""}`;

  const finalFileName = prefix ? `${prefix}-${randomPart}` : randomPart;
  const cleanedPath = path.replace(/^\/+|\/+$/g, "");
  return cleanedPath ? `${cleanedPath}/${finalFileName}` : finalFileName;
};

export const getDataFromDataUrl = (
  dataUrl: string,
): { buffer: Buffer; contentType: string } | null => {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);

  if (!match) {
    console.error("Invalid data URL format");
    return null;
  }
  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  return { buffer, contentType };
};
