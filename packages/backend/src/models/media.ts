export type Extension = "jpg" | "jpeg" | "png" | "mp4" | "mp3";

export interface Media {
  fileId?: string;
  title: string;
  filename: string;
  size: number;
  mimetype: string;
  extension: Extension;
  dateUploaded: string;
  s3Key: string;
}
