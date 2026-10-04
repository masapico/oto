# ホスト直下のads.txt公開

このディレクトリの `ads.txt` は `https://masapico.github.io/ads.txt` 用です。OTOのビルド先 `/oto/` に配置してもホスト直下にはなりません。

2026-10-04に `https://github.com/masapico/masapico.github.io` を作成し、mainブランチ直下にads.txt・index.html・robots.txtを配置、GitHub Pagesを有効化しました。

ルートサイトのファイルは別リポジトリで管理します。この `hosting/` は原稿と手順の控えであり、OTOのビルド・デプロイではルートサイトを自動更新しません。

## ルートサイトを作成する場合

1. GitHubで `masapico.github.io` という名前の公開リポジトリを作成します。
2. そのリポジトリのmainブランチ直下に、この `ads.txt`・`index.html`・`robots.txt` を配置します。既存ファイルがある場合は上書きせず内容を確認してください。
3. Settings → Pages → Deploy from a branchでmain、`/(root)`を選択します。
4. `https://masapico.github.io/ads.txt` にアクセスし、スニペットがテキストとして取得できることを確認します。
5. AdSenseのサイト管理画面でads.txtの状態を確認・再チェックします。反映に時間がかかる場合があります。

`index.html` はOTOへのリンクだけを置いた入口です。自動リダイレクトは行わず、OTOのURL `/oto/` と既存ブックマークは維持します。ルートサイトには広告を掲載しません。

参考： https://support.google.com/adsense/answer/12171612?hl=ja
