# OTO — ギター理論リファレンス

五線譜・指板・音をつなぐ、日本語のギター学習用リファレンスです。`guitar-practice-roadmap.md` の「音符・音名・指板を結びつける」を軸にしています。

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
- `PRODUCTION=1 npm run test:browser`: ビルド済みサイトを `/ideas/` 配下で検証

## 機能

- 音符と指板：標準6弦、0〜22フレット、実音とギターの記音の対応
- コード：三和音・七の和音、転回形、単音／和音／アルペジオ再生
- スケール：主要7種類、メロディックマイナーのクラシック／ジャズ式、ダイアトニックコードの重ね表示
- 短い確認問題：音名、指板位置、コードの度数
- R・3・5・7の色分け、音名・度数・色の表示切り替え
- 画面・主音・コード・スケール・フレット範囲・転回形・選択した音高・メロディックマイナー形式はURLに保持。ブックマークして再利用可能

記録、ログイン、ブラウザへの永続保存、外部APIは使用しません。音はWeb Audioの合成音です。再生ボタンを押すと音声が有効になります。録音や実際のギター演奏の判定は行いません。

## GitHub Pagesへの公開

`.github/workflows/pages.yml` は `main` へのpush、または手動実行でテスト・ビルド・公開します。

1. GitHubリポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定します。
2. この実装を `main` にpushします。
3. Actionsの **Deploy guitar reference** が成功すると公開されます。

このリポジトリの標準URLは `https://masapico.github.io/ideas/` です。相対アセットパスとハッシュURLを使うため、サブディレクトリと直接リンクの再読み込みに対応します。公開URLが有効になるのはデプロイ完了後です。

## 構成と追加方法

- `src/music.ts`: 音程、音名の綴り、実音、構成音、スケール、転回形の純粋関数。新しい種類は `chords` / `scales` の定義に追加します。
- `src/audio.ts`: 共有音源と再生停止。画面切替・再生条件変更・タブ非表示で停止します。
- `src/Staff.tsx` / `src/Fretboard.tsx`: 五線譜と指板。音の高さと表記を共通データから描画します。
- `src/state.ts`: URL条件の検証と復元。

コードの全構成音表示は押弦フォームではありません。スケールに含まれる音かどうかは音高で照合し、和声的な適合性の判定とは区別しています。教本の譜例・音源は収録していません。
