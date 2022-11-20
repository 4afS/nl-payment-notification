export type Payment = {
  date: Date,
  store: string,
  content: string,
  price: number
}

export const parse = (body: string): Payment | undefined => {
  try {
    return {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      date: getDate(body)!,
      store: getStore(body)!,
      content: getContent(body)!,
      price: getPrice(body)!
      /* eslint-enable @typescript-eslint/no-non-null-assertion */
    }
  } catch (e) {
    console.error(e)
    return undefined
  }
}

const dateRegex = /[0-9]{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01]) ([01][0-9]|2[0-3]):[0-5][0-9]/
export const getDate = (body: string): Date | undefined => {
  const re = /◇利用日：.*\n/
  const line = body.match(re)?.[0]
  const date = line?.match(dateRegex)?.[0]

  return date == undefined ? undefined : new Date(date)
}

export const getStore = (body: string): string | undefined => {
  const re = /◇利用先：.*\n/
  const line = body.match(re)?.[0]
  return line?.split("：")[1]?.trim()
}

export const getContent = (body: string): string | undefined => {
  const re = /◇利用取引：.*\n/
  const line = body.match(re)?.[0]
  return line?.split("：")[1]?.trim()
}

const priceRegex = /[-]?(0|[1-9]\d*|[1-9]\d{0,2}(,\d{3})+)円/
export const getPrice = (body: string): number | undefined => {
  const re = /◇利用金額：.*\n/
  const line = body.match(re)?.[0]
  const price = line?.match(priceRegex)?.[0].replace(/,|円/g, "")
  return price == undefined ? undefined : Number(price.trim())
}