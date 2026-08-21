import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({
    required: true,
    enum: ['Urgent', 'High', 'Medium', 'Low', 'No Priority'],
    default: 'No Priority',
  })
  priority!: string;

  @Prop({
    required: true,
    default: 'Unassigned',
  })
  lead!: string;

  @Prop({
    required: true,
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
    default: 'Planning',
  })
  status!: string;

  @Prop({
    required: true,
    min: 0,
    max: 100,
    default: 0,
  })
  progress!: number;

  @Prop({
    required: true,
  })
  dueDate!: string;

  @Prop({
    type: [String],
    default: [],
  })
  labels!: string[];
}

export const ProjectSchema =
  SchemaFactory.createForClass(Project);