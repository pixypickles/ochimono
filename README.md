# Color Feast Drop v1.1

GitHub Pagesでそのまま動くブラウザ版プロトタイプです。

## v1.1
- 難易度を再設計: Easy=通常2色/10房、Normal=通常3色/16房、Hard=通常4色/22房
- Custom: 通常色数、紫喰い周期、自然落下速度を選択可能
- Web Audio APIによる効果音を追加（外部音源不要）
- 連鎖が進むほど消去音の音程が上がる
- 紫喰い、着地、ゲームオーバーにも効果音
- ゲーム中にミュート可能

`index.html` を開くか、GitHub Pagesで公開してください。

## v1.1.1
- Fixed/verified FEAST interval reset after every feast: Easy 10, Normal 16, Hard 22.
- Added cache-busting query strings so GitHub Pages/browser does not reuse an older game.js.
