# Training Log

スマホ対応のトレーニング記録Webアプリです。

## ローカルで開く

`start-local.bat` をダブルクリックすると、次のURLで起動します。

```text
http://localhost:4173
```

同じWi-Fiに接続したスマホから開く場合は、PCのIPv4アドレスを使います。

```text
http://10.31.45.159:4173
```

## 公開URLにする

このアプリは静的ファイルだけで動くため、Netlify、Vercel、GitHub Pages、Cloudflare Pages などに配置できます。

公開後は `https://...` のURLで開けます。HTTPSで開くとPWAとしてホーム画面追加とオフラインキャッシュが有効になります。

## PWA対応

- `manifest.webmanifest`
- `service-worker.js`
- スマホ用メタタグ
- ホーム画面追加用アイコン
