export interface FilesData {
  name: string;
  version: string;
  rawFiles: string[];
  files: string[];
  sri: {
    [key: string]: string;
  };
}
