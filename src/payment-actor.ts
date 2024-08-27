import { SpawnSystem, Kind, Noop } from '@eigr/spawn-sdk'
import { PaymentState, TransactionState } from './generated/actors/payments'
import { pushTransactionHandler } from './payment-actor/push-transaction-handler'

export const buildPaymentActor = (system: SpawnSystem) => {
  const paymentActor = system.buildActor({
    name: 'PaymentActor',
    kind: Kind.NAMED,
    stateType: PaymentState,
    stateful: true,
    snapshotTimeout: 60_000n,
    deactivatedTimeout: 999_999_999n,
    channels: [
      { action: 'PushTransaction', topic: 'transactions.created' }
    ]
  })

  paymentActor.addAction(
    { name: 'PushTransaction', payloadType: TransactionState, responseType: Noop },
    pushTransactionHandler
  )

  return paymentActor
}

