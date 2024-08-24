import { ActorContext, Value } from '@eigr/spawn-sdk'
import { PaymentState, TransactionState, TransactionType } from './generated/actors/payments'

export const pushTransactionHandler = async (
  context: ActorContext<PaymentState>,
  payload: TransactionState
): Promise<Value<PaymentState>> => {
  console.log('pushTransactionHandler', { ...payload })

  const transactions = new Set<TransactionState>(context.state.transactions)
  transactions.add(payload)

  const newState: PaymentState = {
    ...context.state,
    orderRefid: context.self.name,
    transactions: [...transactions]
  }

  if (payload.status === 'succeeded' && payload.type == TransactionType.CAPTURE) {
    newState.paidAmount += payload.amount
  }

  if (payload.status === 'succeeded' && payload.type == TransactionType.REFUND) {
    newState.paidAmount -= payload.amount
  }

  return Value.of<PaymentState>().state(newState)
}
