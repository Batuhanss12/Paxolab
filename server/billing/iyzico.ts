import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export type IyzicoConfig = {
  apiKey: string
  secretKey: string
  baseUrl: string
}

export function hasIyzicoKeys(): boolean {
  const key = (process.env.IYZI_API_KEY ?? '').trim()
  const secret = (process.env.IYZI_SECRET_KEY ?? '').trim()
  return Boolean(key && secret)
}

export function getIyzicoConfig(): IyzicoConfig | null {
  if (!hasIyzicoKeys()) return null
  return {
    apiKey: (process.env.IYZI_API_KEY ?? '').trim(),
    secretKey: (process.env.IYZI_SECRET_KEY ?? '').trim(),
    baseUrl: (process.env.IYZI_BASE_URL ?? 'https://sandbox-api.iyzipay.com').trim(),
  }
}

export function publicFrontendUrl(): string {
  return (process.env.FORMA_PUBLIC_URL ?? 'http://localhost:5173').replace(/\/$/, '')
}

export function publicApiUrl(): string {
  return (process.env.FORMA_API_PUBLIC_URL ?? 'http://localhost:8787').replace(/\/$/, '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IyzipayInstance = any

function createClient(config: IyzicoConfig): IyzipayInstance {
  // CommonJS package — load via createRequire in ESM
  const Iyzipay = require('iyzipay')
  return new Iyzipay({
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    uri: config.baseUrl,
  })
}

export type CheckoutInitInput = {
  conversationId: string
  price: string
  paidPrice: string
  basketId: string
  callbackUrl: string
  buyer: {
    id: string
    name: string
    surname: string
    email: string
    identityNumber: string
    registrationAddress: string
    ip: string
    city: string
    country: string
  }
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
  }
  basketItems: Array<{
    id: string
    name: string
    category1: string
    itemType: string
    price: string
  }>
}

export type CheckoutInitResult = {
  status: string
  token?: string
  paymentPageUrl?: string
  errorMessage?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any
}

export type CheckoutRetrieveResult = {
  status: string
  paymentStatus?: string
  paymentId?: string
  conversationId?: string
  errorMessage?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any
}

function promisifyCreate(
  client: IyzipayInstance,
  request: CheckoutInitInput,
): Promise<CheckoutInitResult> {
  return new Promise((resolve, reject) => {
    client.checkoutFormInitialize.create(request, (err: Error | null, result: CheckoutInitResult) => {
      if (err) reject(err)
      else resolve(result ?? { status: 'failure', errorMessage: 'empty response' })
    })
  })
}

function promisifyRetrieve(
  client: IyzipayInstance,
  request: { locale: string; conversationId: string; token: string },
): Promise<CheckoutRetrieveResult> {
  return new Promise((resolve, reject) => {
    client.checkoutForm.retrieve(request, (err: Error | null, result: CheckoutRetrieveResult) => {
      if (err) reject(err)
      else resolve(result ?? { status: 'failure', errorMessage: 'empty response' })
    })
  })
}

export async function iyzicoCheckoutInitialize(
  input: CheckoutInitInput,
): Promise<CheckoutInitResult> {
  const config = getIyzicoConfig()
  if (!config) throw new Error('iyzico keys missing')
  const Iyzipay = require('iyzipay')
  const client = createClient(config)
  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: input.conversationId,
    price: input.price,
    paidPrice: input.paidPrice,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: input.basketId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1],
    buyer: input.buyer,
    shippingAddress: input.billingAddress,
    billingAddress: input.billingAddress,
    basketItems: input.basketItems.map((item) => ({
      ...item,
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
    })),
  }
  const result = await promisifyCreate(client, request as unknown as CheckoutInitInput)
  return { ...result, raw: result }
}

export async function iyzicoCheckoutRetrieve(
  conversationId: string,
  token: string,
): Promise<CheckoutRetrieveResult> {
  const config = getIyzicoConfig()
  if (!config) throw new Error('iyzico keys missing')
  const Iyzipay = require('iyzipay')
  const client = createClient(config)
  const result = await promisifyRetrieve(client, {
    locale: Iyzipay.LOCALE.TR,
    conversationId,
    token,
  })
  return { ...result, raw: result }
}
