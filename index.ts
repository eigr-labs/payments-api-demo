import spawn, { Kind, Noop } from '@eigr/spawn-sdk'
import { CapturePayload, PaymentState, RefundPayload, TransactionResponse, TransactionState } from './src/generated/actors/payments'
import { captureHandler, refundHandler } from './src/transaction_actor_handler'
import { pushTransactionHandler } from './src/payment_actor_handler'

const system = spawn.createSystem('spawn-system')

const transactionActor = system.buildActor({
  name: 'TransactionActor',
  kind: Kind.UNNAMED,
  stateType: TransactionState,
  stateful: true,
  snapshotTimeout: 5_000n,
  deactivatedTimeout: 10_000n
})

transactionActor.addAction(
  { name: 'Capture', payloadType: CapturePayload, responseType: TransactionResponse },
  captureHandler
)

transactionActor.addAction(
  { name: 'Refund', payloadType: RefundPayload, responseType: TransactionResponse },
  refundHandler
)

const paymentActor = system.buildActor({
  name: 'PaymentActor',
  kind: Kind.UNNAMED,
  stateType: PaymentState,
  stateful: true,
  snapshotTimeout: 5_000n,
  deactivatedTimeout: 10_000n,
  channels: [
    { action: 'PushTransaction', topic: 'transactions.created' }
  ]
})

paymentActor.addAction(
  { name: 'PushTransaction', payloadType: TransactionState, responseType: Noop },
  pushTransactionHandler
)

system.register().then(() => {
  console.log('[SpawnSystem] Actors registered successfully')

  console.debug(
    '[SpawnSystem] [debug] Make sure to run the Spawn Proxy with the `spawnctl dev run` command'
  )
})
