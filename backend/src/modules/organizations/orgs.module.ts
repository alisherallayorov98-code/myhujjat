import { Module }               from '@nestjs/common'
import { OrgsController }       from './orgs.controller'
import { OrgsService }          from './orgs.service'
import { OrgMembersController } from './org-members.controller'
import { OrgMembersService }    from './org-members.service'
import { PrismaModule }         from '../prisma/prisma.module'

@Module({
  imports:     [PrismaModule],
  controllers: [OrgsController, OrgMembersController],
  providers:   [OrgsService, OrgMembersService],
  exports:     [OrgsService, OrgMembersService],
})
export class OrgsModule {}
