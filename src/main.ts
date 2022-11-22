const main = () => {
  const now = new Date(Date.now())
  const mails = fetchMails(INTERVAL_SEC)
  if (mails.length > 0) {
    const prevPayments = loadPayments()

    const payments: Payment[] =
      removeDuplicates(
        prevPayments,
        mails.map(mail => parse(mail.id, mail.body))
          .flat()
          .filter(payment => payment?.date.getMonth() === now.getMonth())
          .filter((payment): payment is Payment => payment !== undefined)
      )
    if (payments.length > 0) {
      writePayments(payments)

      const allPayments = prevPayments.concat(payments)
      const total = allPayments.map(payment => payment.price).reduce((s, v) => s + v, 0)
      const currentUsed = payments.map(payment => payment.price).reduce((s, v) => s + v, 0)
      sendToSlack(total, currentUsed, payments)
    }
  }
}

export const removeDuplicates = (prev: Payment[], current: Payment[]): Payment[] => {
  const ids = prev.map(p => p.id)
  return current.filter(payment =>
    ids.indexOf(payment.id) === -1
  )
}

const INTERVAL_SEC = 7 * 24 * 60 * 60

// =============================== gmail.ts ===============================
type Mail = {
  id: string,
  body: string,
}

const fetchMails = (interval: number): Mail[] => {
  const threads = GmailApp.search(terms(interval))
  const mails: GoogleAppsScript.Gmail.GmailMessage[] = GmailApp.getMessagesForThreads(threads).flat()
  return mails.map(mail => ({
    id: mail.getId(),
    body: mail.getBody()
  }))
}

const terms = (interval: number) => `label:NL_利用通知 after:${now - interval}`
const now = Math.floor(new Date().getTime() / 1000)

// =============================== payment.ts ===============================
export type Payment = {
  id: string,
  date: Date,
  store: string,
  content: string,
  price: number
}

const dateRegex = /[0-9]{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])/
export const getDate = (body: string): Array<Date | undefined> => {
  const re = /◇利用日：.*\r/g
  const lines = Array.from(body.matchAll(re))
  const dates = lines?.map(line => line?.[0].match(dateRegex)?.[0])

  return dates.map(date => date == undefined ? undefined : new Date(date.trim()))
}

export const getStore = (body: string): Array<string | undefined> => {
  const re = /◇利用先：.*\r/g
  const lines = Array.from(body.matchAll(re))
  return lines.map(line => line?.[0].split("：")[1]?.trim())
}

export const getContent = (body: string): Array<string | undefined> => {
  const re = /◇利用取引：.*\r/g
  const lines = Array.from(body.matchAll(re))
  return lines.map(line => line?.[0].split("：")[1]?.trim())
}

const priceRegex = /[-]?(0|[1-9]\d*|[1-9]\d{0,2}(,\d{3})+)円/g
export const getPrice = (body: string): Array<number | undefined> => {
  const re = /◇利用金額：.*\r/g
  const lines = Array.from(body.matchAll(re))
  const prices = lines.map(line => line?.[0].match(priceRegex)?.[0].replace(/,|円/g, ""))
  return prices.map(price => price == undefined ? undefined : Number(price.trim()))
}

export const parse = (id: string, body: string): Array<Payment> | undefined => {
  try {
    const dates = getDate(body)
    const stores = getStore(body)
    const contents = getContent(body)
    const prices = getPrice(body)

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const payments: Payment[] = prices.map((price, i) => ({
      id: id,
      date: dates[i]!,
      store: stores[i]!,
      content: contents[i]!,
      price: price!
    }))
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    return payments
  } catch (e) {
    console.error(e)
    return undefined
  }
}

// =============================== sheet.ts ===============================
const createSheetIfNotExist = (spreadSheet: GoogleAppsScript.Spreadsheet.Spreadsheet, name: string): GoogleAppsScript.Spreadsheet.Sheet => {
  const sheet = spreadSheet.getSheetByName(name)
  return sheet == null ? spreadSheet.insertSheet(name) : sheet
}

const sheetName = (now: Date) => `${now.getFullYear()}/${now.getMonth() + 1}`
const getSheet = (): GoogleAppsScript.Spreadsheet.Sheet => {
  const now = new Date(Date.now())
  const name = sheetName(now)

  const spreadSheet = SpreadsheetApp.getActiveSpreadsheet()
  return createSheetIfNotExist(spreadSheet, name)
}

const writePayments = (payment: Payment[]) => {
  const sheet = getSheet()
  const startRow = sheet.getLastRow() + 1
  const row = payment.length
  // FIXME: get columns count from Payment object keys
  const column = 5

  const range = sheet.getRange(startRow, 1, row, column)
  range.setValues(payment.map(p => [p.id, p.date, p.store, p.content, p.price]))
}

const loadPayments = (): Payment[] => {
  const sheet = getSheet()

  const row = sheet.getLastRow()
  if (row === 0) {
    return []
  }

  const range = sheet.getRange(`A1:E${row}`)
  const values = range.getValues()
  return values.map(value => ({
    id: value[0],
    date: new Date(value[1]),
    store: value[2],
    content: value[3],
    price: Number(value[4]),
  }))
}

// =============================== slack.ts ===============================
const sendToSlack = (total: number, currentUsed: number, payments: Payment[]) => {
  const props = PropertiesService.getScriptProperties()
  const url = props.getProperty("SLACK_URL")
  if (url == null) {
    throw "failed to get url from script property by `SLACK_URL`"
  }

  const data = JSON.stringify({
    "text": `今月の利用金額が更新されました: ${total.toLocaleString()}円 (${currentUsed >= 0 ? "+" : ""}${currentUsed.toLocaleString()})`,
    "blocks": `[${totalUsageMessage(total)},${paymentsMessage(payments)}]`
  })

  UrlFetchApp.fetch(
    url,
    {
      method: 'post',
      contentType: 'application/json',
      payload: data,
    }
  )
}

const totalUsageMessage = (totalUsage: number): string => {
  return `{
  "type": "header",
  "text": {
    "type": "plain_text",
    "text": "今月の利用金額が更新されました: ${totalUsage.toLocaleString()}円"
  }
}`
}

const paymentsMessage = (payments: Payment[]): string => {
  return payments.map(payment => paymentMessage(payment)).join(",")
}

const MAX_LENGTH = 16

const paymentMessage = (payment: Payment): string => {
  return `{
  "type": "divider"
},
{
  "type": "section",
  "fields": [
    {
      "type": "mrkdwn",
      "text": "店舗: *${ellipsis(payment.store, MAX_LENGTH)}*"
    },
    {
      "type": "mrkdwn",
      "text": "金額: *${payment.price.toLocaleString()}円*"
    }
  ]
}`
}

export const ellipsis = (str: string, max: number): string => {
  const sep = Math.floor(max / 2) - 1
  if (str.length <= max) {
    return str
  } else {
    return `${str.slice(0, sep)}...${str.slice(str.length - sep, str.length)}`
  }
}