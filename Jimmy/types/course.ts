export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  videoUrl: string;
  creatorId: string;
  creatorName: string; // Pour afficher le nom du formateur facilement
  createdAt: string;
}