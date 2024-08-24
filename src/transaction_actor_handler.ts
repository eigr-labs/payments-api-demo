import { ActorContext, Value, payloadFor } from '@eigr/spawn-sdk'
import { CapturePayload, RefundPayload, TransactionResponse, TransactionState, TransactionType } from './generated/actors/payments'
import Stripe from 'stripe'
import spawn from '@eigr/spawn-sdk'

const stripe = new Stripe('sk_test_Ho24N7La5CVDtbmpjc377lJI')

export const captureHandler = async (
  context: ActorContext<TransactionState>,
  payload: CapturePayload
): Promise<Value> => {
  console.log('captureHandler', { ...payload })

  // make sure payment actor is listening
  await spawn.spawnActor(payload.orderRefid, { system: 'spawn-system', actorRef: 'PaymentActor' })
  
  let paymentIntent: Stripe.PaymentIntent;

  paymentIntent = await stripe.paymentIntents.create({
    currency: payload.currency,
    amount: payload.amount,
    payment_method_types: ['card'],
    capture_method: 'manual',
    metadata: {
      order_refid: payload.orderRefid
    }
  })

  paymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, { payment_method: 'pm_card_visa' })
  paymentIntent = await stripe.paymentIntents.capture(paymentIntent.id, { idempotencyKey: payload.id })

  let charge: Stripe.Charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string)

  const response: TransactionResponse = {
    status: paymentIntent.status,
    externalRefid: paymentIntent.id,
    transactionId: payload.id,
    receiptUrl: charge.receipt_url!
  }

  const newState: TransactionState = {
    id: context.self.name,
    orderRefid: payload.orderRefid,
    status: paymentIntent.status,
    currency: payload.currency,
    amount: payload.amount,
    externalRefid: paymentIntent.id,
    type: TransactionType.CAPTURE
  }

  return Value.of<TransactionState, TransactionResponse>()
    .state(newState)
    .response(response)
    .broadcast({
      payload: payloadFor(TransactionState, newState),
      channel: "transactions.created"
    })
}

export const refundHandler = async (
  context: ActorContext<TransactionState>,
  payload: RefundPayload
): Promise<Value> => {
  console.log('refundHandler', { ...payload })

  const captureTxn: TransactionState = await spawn.invoke(payload.captureTransactionId, { action: 'GetState', response: TransactionState })
  await spawn.spawnActor(captureTxn.orderRefid, { system: 'spawn-system', actorRef: 'PaymentActor' })

  const refund = await stripe.refunds.create({
    amount: payload.amount,
    currency: payload.currency,
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
    type: TransactionType.CAPTURE
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
