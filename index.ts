import spawn from '@eigr/spawn-sdk'
import { buildPaymentActor } from './src/payment-actor'
import { buildTransactionActor } from './src/transaction-actor'

const system = spawn.createSystem('spawn-system')

buildPaymentActor(system)
buildTransactionActor(system)

system.register().then(() => {
  console.log('[SpawnSystem] Actors registered successfully')

  console.debug(
    '[SpawnSystem] [debug] Make sure to run the Spawn Proxy with the `spawnctl dev run` command'
  )
})
