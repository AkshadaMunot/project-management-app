import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsIn(['Urgent', 'High', 'Medium', 'Low', 'No Priority'])
  priority!: string;

  @IsString()
  @IsNotEmpty()
  lead!: string;

  @IsString()
  @IsIn(['Planning', 'In Progress', 'Completed', 'On Hold'])
  status!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number;

  @IsString()
  @IsNotEmpty()
  dueDate!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}