import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import { CreateTaskDto } from './dto/create-task.dto';

import {
  Task,
  TaskDocument,
} from './schemas/task.schema';


@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
  ) {}


  // ==================================================
  // CREATE SLUG
  // ==================================================

  private createSlug(title: string): string {
    const cleanTitle = String(title ?? '')
      .trim()
      .toLowerCase();

    if (!cleanTitle) {
      throw new BadRequestException(
        'Task title is required',
      );
    }

    return cleanTitle
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }


  // ==================================================
  // FIND TASK BY CUSTOM ID OR MONGODB ID
  // ==================================================

  private async findTaskById(id: string) {

    // First check custom id
    const taskByCustomId =
      await this.taskModel
        .findOne({ id })
        .lean();

    if (taskByCustomId) {
      return taskByCustomId;
    }


    // Then check MongoDB _id
    if (Types.ObjectId.isValid(id)) {

      const taskByMongoId =
        await this.taskModel
          .findById(id)
          .lean();

      if (taskByMongoId) {
        return taskByMongoId;
      }
    }


    return null;
  }


  // ==================================================
  // GET ALL TASKS
  // ==================================================

  async findAll() {

    const tasks =
      await this.taskModel
        .find()
        .sort({ createdAt: 1 })
        .lean();

    return tasks.map((task: any) => ({
      ...task,

      id:
        task.id ??
        task._id.toString(),
    }));
  }


  // ==================================================
  // GET SINGLE TASK
  // ==================================================

  async findOne(id: string) {

    const task =
      await this.findTaskById(id);

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    return {
      ...task,

      id:
        task.id ??
        task._id.toString(),
    };
  }


  // ==================================================
  // CREATE TASK
  // ==================================================

  async create(createTaskDto: CreateTaskDto) {

    // ----------------------------------------------
    // IMPORTANT: validate request body
    // ----------------------------------------------

    if (!createTaskDto) {
      throw new BadRequestException(
        'Request body is missing',
      );
    }


    if (
      !createTaskDto.title ||
      typeof createTaskDto.title !== 'string' ||
      !createTaskDto.title.trim()
    ) {
      throw new BadRequestException(
        'Task title is required',
      );
    }


    // ----------------------------------------------
    // CREATE CUSTOM ID
    // ----------------------------------------------

    const baseId =
      this.createSlug(
        createTaskDto.title,
      );


    let taskId = baseId;


    // ----------------------------------------------
    // PREVENT DUPLICATE ID
    // ----------------------------------------------

    const existingTask =
      await this.taskModel
        .findOne({
          id: taskId,
        })
        .lean();


    if (existingTask) {

      taskId =
        `${baseId}-${Date.now()}`;
    }


    // ----------------------------------------------
    // CREATE DOCUMENT
    // ----------------------------------------------

    const task =
      new this.taskModel({

        id: taskId,

        title:
          createTaskDto.title.trim(),

        description:
          createTaskDto.description ??
          '',

        priority:
          createTaskDto.priority ??
          'Medium',

        member:
          createTaskDto.member ??
          'Admin',

        status:
          createTaskDto.status ??
          'To Do',

        labels:
          Array.isArray(createTaskDto.labels)
            ? createTaskDto.labels
            : [],

        subtasks:
          Array.isArray(createTaskDto.subtasks)
            ? createTaskDto.subtasks
            : [],

        comments:
          Array.isArray(createTaskDto.comments)
            ? createTaskDto.comments
            : [],
      });


    // ----------------------------------------------
    // SAVE
    // ----------------------------------------------

    const savedTask =
      await task.save();


    // ----------------------------------------------
    // RETURN NORMALIZED TASK
    // ----------------------------------------------

    return {
      ...savedTask.toObject(),

      id:
        savedTask.id ??
        savedTask._id.toString(),
    };
  }


  // ==================================================
  // UPDATE TASK
  // ==================================================

  async update(
    id: string,
    updateData: Partial<CreateTaskDto>,
  ) {

    const existingTask =
      await this.findTaskById(id);


    if (!existingTask) {
      throw new NotFoundException(
        'Task not found',
      );
    }


    const mongoId =
      existingTask._id;


    const task =
      await this.taskModel
        .findByIdAndUpdate(
          mongoId,
          {
            $set: updateData,
          },
          {
            new: true,
            runValidators: true,
          },
        )
        .lean();


    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }


    return {
      ...task,

      id:
        task.id ??
        task._id.toString(),
    };
  }


  // ==================================================
  // DELETE TASK
  // ==================================================

  async remove(id: string) {

    const existingTask =
      await this.findTaskById(id);


    if (!existingTask) {
      throw new NotFoundException(
        'Task not found',
      );
    }


    await this.taskModel
      .findByIdAndDelete(
        existingTask._id,
      );


    return {
      message:
        'Task deleted successfully',
    };
  }
}