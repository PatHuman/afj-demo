import type { InitConfig } from '@aries-framework/core'
import type { Express } from 'express'

import {
  ConnectionInvitationMessage,
  LogLevel,
  Agent,
  AutoAcceptCredential,
  HttpOutboundTransport,
} from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node'
import { startServer } from '@aries-framework/rest'
import { static as stx } from 'express'
import { connect } from 'ngrok'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import { CredDefService } from './controllers/CredDefService'
import { OrgService } from './services/OrgService'
import { TestLogger } from './logger'
import { AgentCleanup } from './utils/AgentCleanup'
import { BCOVRIN_BUILDER_GENESIS } from './utils/utils'

const logger = new TestLogger(process.env.NODE_ENV ? LogLevel.error : LogLevel.debug)

process.on('unhandledRejection', (error) => {
  if (error instanceof Error) {
    logger.fatal(`Unhandled promise rejection: ${error.message}`, { error })
  } else {
    logger.fatal('Unhandled promise rejection due to non-error error', {
      error,
    })
  }
})

const run = async () => {
  const endpoint = process.env.AGENT_ENDPOINT ?? (await connect(7001))
  const agentConfig: InitConfig = {
    label: 'paramira',
    walletConfig: {
      id: 'my_wallet',
      key: process.env.AGENT_WALLET_KEY ?? 'passpass',
    },
    indyLedgers: [
      {
        id: 'buildernet',
        genesisTransactions: BCOVRIN_BUILDER_GENESIS,
        isProduction: false,
      },
    ],
    logger: logger,
    publicDidSeed: process.env.AGENT_PUBLIC_DID_SEED,
    endpoints: [endpoint],
    autoAcceptConnections: true,
    autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
    useLegacyDidSovPrefix: true,
    connectionImageUrl: 'https://i.imgur.com/g3abcCO.png',
  }

  const agent = new Agent(agentConfig, agentDependencies)

  const httpInbound = new HttpInboundTransport({
    port: 7001,
  })

  agent.registerInboundTransport(httpInbound)

  agent.registerOutboundTransport(new HttpOutboundTransport())

  await agent.initialize()

  const app: Express = createExpressServer({
    controllers: [__dirname + '/controllers/**/*.ts', __dirname + '/controllers/**/*.js'],
    cors: true,
    routePrefix: '/demo',
  })
//  app.set("domain", "192.168.56.101")
  httpInbound.app.get('/', async (req, res) => {
    if (typeof req.query.c_i === 'string') {
      try {
        const invitation = await ConnectionInvitationMessage.fromUrl(req.url.replace('d_m=', 'c_i='))
        res.send(invitation.toJSON())
      } catch (error) {
        res.status(500)
        res.send({ detail: 'Unknown error occurred' })
      }
    }
  })

  app.use('/public', stx(__dirname + '/public'))

  const  orgService = new OrgService(agent)
  const credDefService = new CredDefService(agent)
  useContainer(Container)
  Container.set(CredDefService, credDefService)
  Container.set(OrgService, orgService)

  const job = AgentCleanup(agent)
  job.start()

  app.get('/server/last-reset', async (req, res) => {
    res.send(job.lastDate())
  })

  await startServer(agent, {
    port: 7000,
    app: app,
  })
}

run()
