import { RecordNotFoundError, SchemaTemplate } from '@aries-framework/core'
// import { Agent,SchemaTemplate } from '@aries-framework/core'
import { Get,Post,  Body, InternalServerError, JsonController, NotFoundError, Param } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import { OrgService } from '../services/OrgService'

@JsonController('/register')
@Service()
export class CredentialController {
  @Inject()
  private service: OrgService

  public constructor(service: OrgService) {
    this.service = service
  }

  @Post('/schema')
  public async createSchema(@Body() schema: SchemaTemplate) {
       
      const newSchema = await this.service.createSchema(schema)
     return newSchema
  }  

  @Post('/credentialDef')
  public async createCredentialDefinition(@Body() credDef: {
    schemaId: string
    supportRevocation: boolean
    tag: string
  }) {
       
      const newCredDef = await this.service.createCredentialDefinition(credDef)
     return newCredDef
  }  

//   @Get('/:connectionId')
//   public async getAllCredentialsByConnectionId(@Param('connectionId') connectionId: string) {
//     try {
//       return this.service.getAllCredentialsByConnectionId(connectionId)
//     } catch (error) {
//       if (error instanceof RecordNotFoundError) {
//         throw new NotFoundError(`credentials for connectionId "${connectionId}" not found.`)
//       }
//       throw new InternalServerError(`something went wrong: ${error}`)
//     }
//   }
}
