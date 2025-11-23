export class BaseEntity {
  _id!: string;
  deletedBy!: string | null;
  deletedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
