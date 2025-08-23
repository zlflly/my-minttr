export interface PhotoNote {
  id: string;
  imageUrl: string;
  imageAlt?: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewPhotoData {
  file: File;
  note: string;
}