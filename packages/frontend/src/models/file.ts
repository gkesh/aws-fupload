export type Extension = "jpg" | "jpeg" | "png" | "mp4" | "mp3";

export interface Media {
  fileId?: string;
  title: string;
  filename: string;
  extension: Extension;
  size: number;
  mimetype: string;
  dateUploaded: string;
  s3Key?: string;
  url?: string;
}
