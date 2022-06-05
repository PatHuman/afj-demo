import type { CredentialRecord } from '@aries-framework/core'
import type { CredDef } from 'indy-sdk'

import { Agent,SchemaTemplate } from '@aries-framework/core'
import { Inject, Service } from 'typedi'

@Service()
export class OrgService {
  @Inject()
  private agent: Agent
  private credentialDefinitions: CredDef[] = []

  public constructor(agent: Agent) {
    this.agent = agent
    // this.getCredsDefinitions(agent)
 
    // registerPublicDid(did: string, verkey: string, alias: string, role?: NymRole): Promise<string>;
  }

  public  async createSchema( schema:SchemaTemplate){
    /*
    {
    name: string;
    version: string;
    attributes: string[];
}
    */
    return await this.agent.ledger.registerSchema(schema )   

  }
  

  public  async getCredsDefinitions( credDefinition: string){
     return await this.agent.ledger.getCredentialDefinition(credDefinition)
    //  return await agent.ledger.getCredentialDefinition("W6cLf8W11VSfzKurarYopG:3:CL:31282:ID Card")
     

   }

  

  public getCredentialDefinitionIdByTag(tag: string) {
    const def = this.credentialDefinitions.find((x) => x.tag === tag)

    if (!def) {
      throw new Error(`CredentialDefinition not found for ${tag}`)
    }

    return def.id
  }

  public async getAllCredDefs() {
    if (this.credentialDefinitions.length === 0) {
      // await this.init()
    }
    return this.credentialDefinitions
  }

  public async getAllCredentialsByConnectionId(connectionId: string) {
    const credentials = await this.agent.credentials.getAll()
    const filtered = credentials.filter((cred: CredentialRecord) => cred.connectionId === connectionId)

    return filtered.map((c) => c.toJSON())
  }
 

  public async createCredentialDefinition(credentialDef: {
    schemaId: string
    supportRevocation: boolean
    tag: string
  }) {
    const schema = await this.agent.ledger.getSchema(credentialDef.schemaId)

    return await this.agent.ledger.registerCredentialDefinition({
      schema,
      supportRevocation: credentialDef.supportRevocation,
      tag: credentialDef.tag,
    })
  }
}
