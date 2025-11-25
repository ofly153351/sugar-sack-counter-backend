import { PartialType } from '@nestjs/mapped-types';
import { CreateCountingSessionDto } from './create-counting-session.dto';

export class UpdateCountingSessionDto extends PartialType(CreateCountingSessionDto) {}
