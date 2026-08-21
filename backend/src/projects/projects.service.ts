import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Project,
  ProjectDocument,
} from './schemas/project.schema';

import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async findAll() {
    return this.projectModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const project = await this.projectModel
      .findById(id)
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(createProjectDto: CreateProjectDto) {
    const project = new this.projectModel(
      createProjectDto,
    );

    return project.save();
  }

  async update(
    id: string,
    updateData: Partial<CreateProjectDto>,
  ) {
    const project =
      await this.projectModel.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        },
      ).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async remove(id: string) {
    const project =
      await this.projectModel.findByIdAndDelete(id).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      message: 'Project deleted successfully',
    };
  }
}