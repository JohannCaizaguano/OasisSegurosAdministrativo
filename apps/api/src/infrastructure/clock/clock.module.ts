import { Global, Module } from '@nestjs/common';

import { TOKENS_TRANSVERSALES } from '../../shared-kernel/tokens';

class RelojDelSistema {
  ahora(): Date {
    return new Date();
  }
}

@Global()
@Module({
  providers: [{ provide: TOKENS_TRANSVERSALES.CLOCK, useClass: RelojDelSistema }],
  exports: [TOKENS_TRANSVERSALES.CLOCK],
})
export class ClockModule {}
