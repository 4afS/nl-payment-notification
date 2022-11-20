# nl-payment-notification

## 導入手順
このリポジトリをクローン

claspのセットアップをしてローカルからpush

GASのプロパティ設定画面から、Slackのwebhook URLを登録

管理画面からテスト実行 -> slackに通知されれば動作確認は成功

タイマーを5分置きぐらいに設定して終わり

## gmailのラベル設定
### ラベルの作成

左のラベル欄にある `+` をクリックし、`NL_利用通知` のラベルを作成。

### 自動でラベルを付ける

左の `ラベル管理` から `フィルタとブロック中のアドレス` タブに移動

中央にある `新しいフィルタを作成` から新規フィルタを作成

下記の条件を `件名` の入力欄に追加し、`フィルタを作成` ボタンをクリック

```
"ご利用のお知らせ【三井住友カード】" OR "ご利用明細のお知らせ【三井住友カード】"
```

フォームからラベルを付与するよう設定

![image](https://user-images.githubusercontent.com/19350567/202915904-2e26ee43-eb5c-47de-b4ba-84d5ef9563e0.png)

# 参考

claspの設定https://dev.classmethod.jp/articles/vscode-clasp-setting/

