import { ActorContext, Value, payloadFor } from '@eigr/spawn-sdk'
import { CapturePayload, RefundPayload, TransactionResponse, TransactionState, TransactionType, PaymentState } from './generated/actors/payments'
import Stripe from 'stripe'
import spawn from '@eigr/spawn-sdk'

const stripe = new Stripe('sk_test_Ho24N7La5CVDtbmpjc377lJI')

export const captureHandler = async (
  context: ActorContext<TransactionState>,
  payload: CapturePayload
): Promise<Value> => {
  // if transaction already has an external refid
  // then we can assume it has already been process, this will
  // prevent double processing of the same transaction and act as a idempotency check
  if (context.state.externalRefid) {
    return Value.of().response({
      status: context.state.status,
      externalRefid: context.state.externalRefid,
      transactionId: context.self.name,
      receiptUrl: ""
    })
  }

  console.log('captureHandler', { ...payload })

  // make sure payment actor is listening
  await spawn.invoke(payload.orderRefid, { ref: 'PaymentActor', action: 'GetState', response: PaymentState })
  
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
  if (context.state.externalRefid) {
    return Value.of().response({
      status: context.state.status,
      externalRefid: context.state.externalRefid,
      transactionId: context.self.name,
      receiptUrl: ""
    })
  }

  console.log('refundHandler', { ...payload })

  const captureTxn: TransactionState = await spawn.invoke(payload.captureTransactionId, { action: 'GetState', response: TransactionState, ref: 'TransactionActor' })
  await spawn.invoke(captureTxn.orderRefid, { ref: 'PaymentActor', action: 'GetState', response: PaymentState })

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
