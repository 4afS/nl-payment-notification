import { getContent, getDate, getPrice, getStore, parse } from "../src/main";

// eslint-disable-next-line no-irregular-whitespace
const body = `AAA　様\r\n\r\nいつも三井住友カードをご利用頂きありがとうございます。\r\nお客様のカードご利用内容をお知らせいたします。\r\n\r\nご利用カード：三井住友カードＶＩＳＡ（ＮＬ）\r\n\r\n◇利用日：2022/11/06 10:11\r\n◇利用先：Visa加盟店\r\n◇利用取引：買物\r\n◇利用金額：-10,881円\r\n\r\nご利用内容について、万が一身に覚えのない場合は、ご自身でカードのご利用を一時的に制限することが可能な「あんしん利用制限サービス」をご用意しております。以下URLよりご設定ください。\r\n▼あんしん利用制限サービスについて\r\nhttp://vpass.jp/usage2m/\r\n\r\n※カードご利用の承認照会があった場合に通知されるサービスであり、カードのご利用 及び ご請求を確定するものではありません。\r\n※ご利用店舗は、当社に売上の情報が到着後、Vpassのご利用明細照会やWEB明細で確認していただけます。反映までにお日にちがかかる場合がございます。\r\n※あとからリボ、あとから分割はご利用の内容がVpassのご利用明細照会やWEB明細に反映後、お申込みいただけるようになります。\r\n※携帯電話や公共料金などの継続的なご利用（注） 及び ETCやPiTaPa等、一部の電子マネー利用については通知されません。\r\n（注）利用内容によっては通知される可能性がございます。\r\n\r\n▼Vpassのログインはこちら\r\nhttps://www.smbc-card.com/mem/index.jsp\r\n\r\n▼ご利用通知サービスのサービス内容紹介はこちら\r\nhttp://vpass.jp/selfcontrol/\r\n\r\n※このメールアドレスは送信専用です。ご返信に回答できません。\r\n\r\n■発行者■\r\n三井住友カード株式会社\r\nhttps://www.smbc-card.com/\r\n〒135-0061 東京都江東区豊洲2丁目2番31号 SMBC豊洲ビル\r\n`

describe("parse mail body to get payment", () => {
  it("should get date", () => {
    expect(getDate(body)).toStrictEqual(new Date("2022-11-06T10:11:00"))
  });

  it("should get store", () => {
    expect(getStore(body)).toEqual("Visa加盟店")
  });

  it("should get content", () => {
    expect(getContent(body)).toEqual("買物")
  });

  it("should get price", () => {
    expect(getPrice(body)).toEqual(10881)
  });

  it("should parse all", () => {
    expect(parse("ID", body)).toEqual({
      id: "ID",
      date: new Date("2022-11-06T10:11:00"),
      store: "Visa加盟店",
      content: "買物",
      price: 10881
    })
  });
});
