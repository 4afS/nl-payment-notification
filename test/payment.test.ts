import { getContent, getDate, getPrice, getStore, parse } from "../src/payment";

// eslint-disable-next-line no-irregular-whitespace
const body = `Hibiki　様

いつも三井住友カードをご利用頂きありがとうございます。
お客様のカードご利用内容をお知らせいたします。

ご利用カード：三井住友カードＶＩＳＡ（ＮＬ）

◇利用日：2022/10/03 11:08
◇利用先：Visa加盟店
◇利用取引：返品
◇利用金額：-7,150円

ご利用内容について、万が一身に覚えのない場合は、ご自身でカードのご利用を一時的に制限することが可能な「あんしん利用制限サービス」をご用意しております。以下URLよりご設定ください。
▼あんしん利用制限サービスについて
http://vpass.jp/usage2m/

※カードご利用の承認照会があった場合に通知されるサービスであり、カードのご利用 及び ご請求を確定するものではありません。
※ご利用店舗は、当社に売上の情報が到着後、Vpassのご利用明細照会やWEB明細で確認していただけます。反映までにお日にちがかかる場合がございます。
※あとからリボ、あとから分割はご利用の内容がVpassのご利用明細照会やWEB明細に反映後、お申込みいただけるようになります。
※携帯電話や公共料金などの継続的なご利用（注） 及び ETCやPiTaPa等、一部の電子マネー利用については通知されません。
（注）利用内容によっては通知される可能性がございます。

▼Vpassのログインはこちら
https://www.smbc-card.com/mem/index.jsp

▼ご利用通知サービスのサービス内容紹介はこちら
http://vpass.jp/selfcontrol/

※このメールアドレスは送信専用です。ご返信に回答できません。

■発行者■
三井住友カード株式会社
https://www.smbc-card.com/
〒135-0061 東京都江東区豊洲2丁目2番31号 SMBC豊洲ビル
`

describe("parse mail body to get payment", () => {
  it("should get date", () => {
    expect(getDate(body)).toStrictEqual(new Date("2022-10-03T11:08:00"))
  });

  it("should get store", () => {
    expect(getStore(body)).toEqual("Visa加盟店")
  });

  it("should get content", () => {
    expect(getContent(body)).toEqual("返品")
  });

  it("should get price", () => {
    expect(getPrice(body)).toEqual(-7150)
  });

  it("should parse all", () => {
    expect(parse(body)).toEqual({
      date: new Date("2022-10-03T11:08:00"),
      store: "Visa加盟店",
      content: "返品",
      price: -7150
    })
  });
});
