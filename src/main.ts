const main = () => {
  const mails = fetchMails(INTERVAL_SEC)
  console.log(mails)
  if (mails.length > 0) {
    const prevPayments = loadPayments()

    const payments: Payment[] =
      removeDuplicates(
        prevPayments,
        mails.map(mail => parse(mail.id, mail.body)).filter((payment): payment is Payment => payment !== undefined)
      )
    if (payments.length > 0) {
      writePayments(payments)

      const allPayments = prevPayments.concat(payments)
      const sum = allPayments.map(payment => payment.price).reduce((s, v) => s + v, 0)
      sendToSlack(sum, payments)
    }
  }
}

export const removeDuplicates = (prev: Payment[], current: Payment[]): Payment[] => {
  const ids = prev.map(p => p.id)
  return current.filter(payment =>
    ids.indexOf(payment.id) === -1
  )
}

const INTERVAL_MIN = 5
const BUFFER_SEC = 5
const INTERVAL_SEC = INTERVAL_MIN * 60 + BUFFER_SEC

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const terms = (interval: number) => `label:NL_利用通知`
// const terms = (interval: number) => `label:NL_利用通知 after:${now - interval}`
// const now = Math.floor(new Date().getTime() / 1000)

// =============================== payment.ts ===============================
export type Payment = {
  id: string,
  date: Date,
  store: string,
  content: string,
  price: number
}

const dateRegex = /[0-9]{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01]) ([01][0-9]|2[0-3]):[0-5][0-9]/
export const getDate = (body: string): Date | undefined => {
  const re = /◇利用日：.*\r/
  const line = body.match(re)?.[0]
  const date = line?.match(dateRegex)?.[0]

  return date == undefined ? undefined : new Date(date)
}

export const getStore = (body: string): string | undefined => {
  const re = /◇利用先：.*\r/
  const line = body.match(re)?.[0]
  return line?.split("：")[1]?.trim()
}

export const getContent = (body: string): string | undefined => {
  const re = /◇利用取引：.*\r/
  const line = body.match(re)?.[0]
  return line?.split("：")[1]?.trim()
}

const priceRegex = /[-]?(0|[1-9]\d*|[1-9]\d{0,2}(,\d{3})+)円/
export const getPrice = (body: string): number | undefined => {
  const re = /◇利用金額：.*\r/
  const line = body.match(re)?.[0]
  const price = line?.match(priceRegex)?.[0].replace(/,|円/g, "")
  return price == undefined ? undefined : Number(price.trim())
}

export const parse = (id: string, body: string): Payment | undefined => {
  try {
    return {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      id: id,
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
const sendToSlack = (total: number, payments: Payment[]) => {
  const props = PropertiesService.getScriptProperties()
  const url = props.getProperty("SLACK_URL")
  if (url == null) {
    throw "failed to get url from script property by `SLACK_URL`"
  }

  const data = JSON.stringify({
    'blocks': `[${totalUsageMessage(total)},${paymentsMessage(payments)}]`
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

const paymentMessage = (payment: Payment): string => {
  return `{
  "type": "divider"
},
{
  "type": "section",
  "fields": [
    {
      "type": "mrkdwn",
      "text": "*店舗:*\n${payment.store}"
    },
    {
      "type": "mrkdwn",
      "text": "*金額:*\n${payment.price.toLocaleString()}円"
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