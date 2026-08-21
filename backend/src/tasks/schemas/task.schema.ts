import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true })
export class Task {
  @Prop({
    unique: true,
    sparse: true,
    index: true,
  })
  id?: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: 'Medium' })
  priority!: string;

  @Prop({ default: 'Admin' })
  member!: string;

  @Prop({ default: 'To Do' })
  status!: string;

  @Prop({ type: [String], default: [] })
  labels!: string[];

  @Prop({
    type: [
      {
        id: Number,
        title: String,
        completed: Boolean,
      },
    ],
    default: [],
  })
  subtasks!: {
    id: number;
    title: string;
    completed: boolean;
  }[];

  @Prop({ type: [String], default: [] })
  comments!: string[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);