# Color Bridge Drop

色付き落下ピースを左右につなぐ、落ちものパズルのルール検証用プロトタイプです。

## 現在のルール
- 盤面: 8 x 16
- 3色＋オールカラー（約8%）、1ピースは単色
- 1〜4マスのピース（1/2/3/4マス形状を混在）
- 横一列完成では消えません
- 同色セルが上下左右で連結し、左端から右端まで到達すると、その連結成分を消去
- 消去後はセル単位で下に落下
- 落下後に別の左右接続が成立すれば連鎖
- NEXT 3個、HOLDなし

## 操作
- ← →: 移動
- ↑: 回転
- ↓: 1段落下
- Space: ハードドロップ
- スマホ: 画面下部の操作ボタン

## 実行
`index.html` をブラウザで開くだけです。GitHub Pagesでもそのまま公開できます。

## GitHub Pages
Repository Settings > Pages から、Deploy from a branch を選び、`main` / root を指定してください。

## 次に検証したい項目
- 3色＋オールカラー（約8%）で左右接続が難しすぎないか
- 1マス/2マスの出現率
- ピース形状ごとの出現率
- 8列と10列の比較
- 横ライン消去を救済ルールとして追加する必要があるか


## v0.2
- 通常色を4色から3色に変更
- 約8%の確率でオールカラーピースが出現
- オールカラーは赤・青・黄のどの接続にも使え、橋の消去時に一緒に消えます


## v0.4
- 通常色を緑・紫・オレンジに変更
- 左右の壁に、壁へ接触しているセルの色マーカーを表示
- 操作ボタンを左側の方向キー群／右側の左回転・右回転ボタンに再配置
- 左回転を追加（キーボード Z、右回転 X/↑）


## v0.4 visual change
Locked blocks of the same color now visually merge with no internal seam. Different colors retain a dark boundary. Falling pieces remain visibly segmented until they lock.
