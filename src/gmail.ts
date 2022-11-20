export type Mail = {
  id: string,
  date: Date,
  body: string,
}

export const fetchMails = (interval: number): Mail[] => {

  const threads = GmailApp.search(terms(interval))
  const mails: GoogleAppsScript.Gmail.GmailMessage[] = GmailApp.getMessagesForThreads(threads).flat()
  return mails.map(mail => ({
    id: mail.getId(),
    date: new Date(mail.getDate().getTime()),
    body: mail.getBody()
  }))

}

const terms = (interval: number) => `label:NL_利用通知 after:${now - interval}`
const now = Math.floor(new Date().getTime() / 1000)