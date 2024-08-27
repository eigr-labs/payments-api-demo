import { ActorContext, Value } from '@eigr/spawn-sdk'
import { PaymentState, PaymentBreakdown, TransactionState, TransactionType } from '../generated/actors/payments'

export const pushTransactionHandler = async (
  context: ActorContext<PaymentState>,
  payload: TransactionState
): Promise<Value<PaymentState>> => {
  console.log('pushTransactionHandler', { ...payload })

  const transactions = context.state.payments[payload.orderRefid]?.transactions || []
  transactions.push(payload)

  const newEntry: PaymentBreakdown = {
    paidAmount: context.state.payments[payload.orderRefid]?.paidAmount || 0,
    orderRefid: context.self.name,
    transactions: transactions
  }

  if (payload.status === 'succeeded' && payload.type === TransactionType.CAPTURE) {
    newEntry.paidAmount += payload.amount
  }

  if (payload.status === 'succeeded' && payload.type === TransactionType.REFUND) {
    newEntry.paidAmount -= payload.amount
  }

  const payments = context.state.payments
  payments[payload.orderRefid] = newEntry

  const newState: PaymentState = {
    ...context.state, payments
  }

  return Value.of<PaymentState>().state(newState)
}
