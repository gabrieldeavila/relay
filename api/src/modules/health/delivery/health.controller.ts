import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/delivery/public.decorator.js';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
