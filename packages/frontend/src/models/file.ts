export type Extension = "jpg" | "jpeg" | "png" | "mp4" | "mp3";

export interface Media {
  title: string;
  filename: string;
  extension: Extension;
  dateUploaded: Date;
  s3Key: string;
}
