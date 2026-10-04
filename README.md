# OTO — ギターリファレンス

五線譜・指板・音をつなぐ、日本語のギター学習用リファレンスです。

## 起動

Node.js 22以上を使用します。

```sh
npm ci
npm run dev
```

- `npm test`: 音楽理論のテスト
- `npm run build`: TypeScript検査と静的サイト生成（`dist/`）
- `npm run test:browser`: Chromeによるブラウザテスト。Macの標準インストール先以外では `CHROME_PATH` でブラウザ実行ファイルを指定
- `BROWSER_ENGINE=webkit npm run test:browser`: WebKitで検証（初回は `npx playwright install webkit`）
- `PRODUCTION=1 npm run test:browser`: ビルド済みサイトを `/oto/` 配下で検証

## 機能

- 音符と指板：標準6弦、0〜22フレット、実音とギターの記音の対応
- コード：三和音・七の和音（maj7♯5を含む）、転回形、単音／和音／アルペジオ再生
- スケール：12種類、メジャー系7モードの網羅、メロディックマイナーのクラシック／ジャズ式
- スケール比較：同じ主音で音名・度数・五線譜・A/B再生・指板を比較。共通音／固有音を文字と輪郭で表示
- コードとの関係：全7音スケールで三和音・七の和音を生成し、指板に重ね表示。クラシック式下行は自然短音階から生成
- モードの親メジャースケールへのリンク（主音の違いを説明）
- 短い確認問題：音名、指板位置、コードの度数
- R・3・5・7の色分け、音名・度数・色の表示切り替え
- 画面・主音・コード・スケール・フレット範囲・転回形・選択した音高・メロディックマイナー形式・比較対象・再生方向・選択したスケール内コード・三和音／七の和音設定はURLに保持。ブックマークして再利用可能

学習の記録、ログイン、ブラウザへの学習履歴の永続保存、外部APIは使用しません。音は端末内で生成する合成音です。SafariおよびiOSのWebKitブラウザは同じ音をWAVに生成してHTML Audioで再生し、その他のブラウザはWeb Audioを使用します。再生ボタンを押すと音声が有効になります。録音や実際のギター演奏の判定は行いません。AdSenseは所有確認用metaタグを設置済みで、初期状態では広告配信用スクリプトを読み込みません。

## 学習ガイドと検索対応

公開先は `https://masapico.github.io/oto/` です。`/oto/guides/` に14記事、`about/`・`contact/`・`privacy/`・`terms/` に運営情報を用意しています。既存のツールは `/oto/` とハッシュ付きURLを維持します。

- `site/content.ts`: 記事のslug、タイトル、説明、分類、本文、練習、確認のポイント、関連記事、ツールの初期設定。
- `site/render.ts`: 記事HTMLと構成音の図。音名・度数・ダイアトニックコードは `src/music.ts` を使用。
- `site/plugin.ts`: Viteのビルド時に独立したHTMLを出力。開発時にも同じページを提供。
- `site/config.ts`: 公開先、著者、更新日、AdSense設定。

記事の本文とリンクはJavaScriptなしで読めます。記事ごとのcanonical、OGP、Article・パンくず構造化データ、`sitemap.xml`を生成します。初回公開日・更新日は2026-10-04です。後日追加する記事には `published`、修正する記事には `updated` を `YYYY-MM-DD` 形式で設定してください。初期記事の既定値は `site.published` を使い、他の記事の変更で公開日が変わらないようにしています。

OGP画像の再生成は `node scripts/generate-ogp.mjs`。Chromeを使用し、`public/ogp.png` に出力します。

Search ConsoleはURLプレフィックス `https://masapico.github.io/oto/` を登録し、GitHub Pagesの管理権限など利用可能な方法で所有確認後、`https://masapico.github.io/oto/sitemap.xml` を送信します。初期実装にはGoogle Analyticsや追加のアクセス追跡タグを含めません。公開4週間後に検索表示回数・クリック・検索語句を確認し、記事を改善します。

## AdSenseの申請・有効化

パブリッシャーIDは `pub-3056490289410063`。ツール・記事・運営情報に `google-adsense-account` metaタグを設置しています。広告コードは記事末尾に限り、初期状態では無効です。

1. コンテンツ公開後、AdSenseに `masapico.github.io` を登録します。ホスト配下に別サイトを置いている場合、それらも同じホストに属するため、アカウント側の審査対象・広告設定を確認してください。
2. metaタグ方式で所有確認し、審査を申請します。スニペットに含まれるパブリッシャーIDだけで審査承認や広告ユニットIDが発行されるわけではありません。
3. AdSenseの「プライバシーとメッセージ」で、EEA・英国・スイスなど対象地域に適したGoogle認定CMPのメッセージを設定・公開します。拒否・選択変更の動作を確認します。独自のCookieバナーで代替せず、Googleの管理画面の設定と配信要件を確認してください。
4. 自動広告は無効にし、レスポンシブディスプレイ広告のユニットを作成します。
5. 承認・同意設定の完了後、`site/config.ts` の `adsense.slot` に実際の数値IDを設定し、`enabled` を `true` にします。`privacy/` の掲載状況の記述はこの設定に合わせて自動で切り替わります。
6. ビルドと本番ブラウザテストを実行し、記事末尾の1枠だけに表示されることを確認して公開します。実広告のクリックはテストしません。広告の未配信・ブロック時も記事やツールは利用できます。

表示を止める場合は `enabled: false` に戻して再公開します。所有確認用metaタグは維持します。広告の自動更新、ツール操作時の再リクエスト、自動広告用コードは実装していません。

### ads.txtの公開先

提供いただいたスニペットは `hosting/ads.txt` に用意しました。

```text
google.com, pub-3056490289410063, DIRECT, f08c47fec0942fa0
```

公開先は **`https://masapico.github.io/ads.txt`** です。OTOの `public/` に置くと `/oto/ads.txt` になるため、このプロジェクトのビルドには含めません。

2026-10-04にルートサイト用の公開リポジトリ `https://github.com/masapico/masapico.github.io` を作成し、mainブランチ直下からGitHub Pagesで公開する設定を行いました。ads.txt、OTOへの入口、サイトマップを案内するrobots.txtを配置しています。既存のOTOのURLは変更しません。今後スニペットを変更する場合は、このリポジトリ内の `hosting/ads.txt` だけでなく、ルートサイト側も更新してください。詳細は `hosting/README.md` を参照してください。

### 公開前の確認

```sh
npm test
npm run build
PRODUCTION=1 npm run test:browser
```

mainへのpushでGitHub Actionsがテスト・ビルド後にGitHub Pagesへ公開します。公開後は記事の深いURL、サイトマップ、OGP画像、所有確認用metaタグを確認します。AdSense申請、CMP公開、広告ユニット発行はGoogleアカウント側の操作が必要です。審査の承認や検索順位・収益は保証しません。

## 構成と追加方法

- `src/music.ts`: 音程、音名の綴り、実音、構成音、スケール、転回形の純粋関数。新しい種類は `chords` / `scales` の定義に追加します。スケールは `group` で選択肢の分類を指定し、メジャー系モードには `modeDegree`（親メジャーの何番目の音が主音か）を設定します。コードの記号は `chordSuffix` に追加します。7音スケールを追加する場合は、3度積みで生じる和音の定義も必要です。
- `src/audio.ts`: 共有音源と再生停止。画面切替・再生条件変更・タブ非表示で停止します。
- `src/audio-render.ts`: 両再生方式の弦音の合成、和音・アルペジオのタイミング、Safari用WAVの生成。外部音源のダウンロードは不要です。
- `src/Staff.tsx` / `src/Fretboard.tsx`: 五線譜と指板。音の高さと表記を共通データから描画します。
- `src/state.ts`: URL条件の検証と復元。

コードの全構成音表示は押弦フォームではありません。スケールに含まれる音かどうかは音高で照合し、和声的な適合性の判定とは区別しています。教本の譜例・音源は収録していません。
