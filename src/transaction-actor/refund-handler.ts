import { ActorContext, Value, payloadFor } from '@eigr/spawn-sdk'
import { RefundPayload, TransactionResponse, TransactionState, TransactionType, PaymentState } from '../generated/actors/payments'
import Stripe from 'stripe'
import spawn from '@eigr/spawn-sdk'

const stripe = new Stripe('sk_test_Ho24N7La5CVDtbmpjc377lJI')

export const refundHandler = async (
  context: ActorContext<TransactionState>,
  payload: RefundPayload
): Promise<Value> => {
  console.log('refundHandler', { ...payload })

  if (context.state.externalRefid) {
    return Value.of().response({
      status: context.state.status,
      externalRefid: context.state.externalRefid,
      transactionId: context.self.name,
      receiptUrl: ""
    })
  }

  const captureTxn: TransactionState = await spawn.invoke(payload.captureTransactionId, { action: 'GetState', response: TransactionState, ref: 'TransactionActor' })

  const refund = await stripe.refunds.create({
    amount: payload.amount,
    payment_intent: captureTxn.externalRefid
  })

  let charge: Stripe.Charge = await stripe.charges.retrieve(refund.charge as string)
  
  const newState: TransactionState = {
    id: context.self.name,
    orderRefid: captureTxn.orderRefid,
    status: refund.status!,
    currency: payload.currency,
    amount: payload.amount,
    externalRefid: refund.id,
    type: TransactionType.REFUND
  }

  const response: TransactionResponse = {
    status: refund.status!,
    externalRefid: refund.id,
    receiptUrl: charge.receipt_url!,
    transactionId: context.self.name
  }

  return Value.of<TransactionState, TransactionResponse>()
    .state(newState)
    .response(response)
    .broadcast({
      payload: payloadFor(TransactionState, newState),
      channel: "transactions.created"
    })
}
