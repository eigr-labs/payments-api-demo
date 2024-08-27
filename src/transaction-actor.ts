import { SpawnSystem, Kind } from '@eigr/spawn-sdk'
import { CapturePayload, RefundPayload, TransactionResponse, TransactionState } from './generated/actors/payments'
import { captureHandler } from './transaction-actor/capture-handler'
import { refundHandler } from './transaction-actor/refund-handler'

export const buildTransactionActor = (system: SpawnSystem) => {
  const transactionActor = system.buildActor({
    name: 'TransactionActor',
    kind: Kind.UNNAMED,
    stateType: TransactionState,
    stateful: true,
    snapshotTimeout: 30_000n,
    deactivatedTimeout: 60_000n
  })

  transactionActor.addAction(
    { name: 'Capture', payloadType: CapturePayload, responseType: TransactionResponse },
    captureHandler
  )

  transactionActor.addAction(
    { name: 'Refund', payloadType: RefundPayload, responseType: TransactionResponse },
    refundHandler
  )

  return transactionActor
}

