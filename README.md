# LLM Coding Stats

LLM の性能、価格、スループットを比較する Next.js アプリです。Arena Score と 1M tokens あたりの blended price を散布図で表示し、モデルを選択すると OpenRouter 上の provider endpoint ごとの価格と throughput も確認できます。

## Data Sources

- `app/data/llm-models.ts`: モデル名、provider、OpenRouter slug、Arena Score、deprecated フラグを管理します。
- `app/data/llm-definitions.ts`: モデル型、provider の表示設定、blended price 計算を管理します。
- OpenRouter API: 価格と throughput を実行時に取得します。価格が取得できない場合は `0` として扱います。
- `app/lib/openrouter.ts`: OpenRouter API fetch と10分キャッシュを管理します。

Arena Score は公開ベンチマークを元にした手動管理の値を含みます。価格と throughput は OpenRouter API の応答に依存するため、API 側の変更や一時的な失敗で欠損する場合があります。

## Development

依存関係をインストールします。

```bash
npm ci
```

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## Commands

```bash
npm run dev            # Start the development server
npm run build          # Create a production build
npm run start          # Serve the production build
npm run lint           # Run ESLint
npm run typecheck      # Run TypeScript type checking
npm run extract-models # Extract model names and scores from an HTML file
npm run extract-models -- --write # Update app/data/llm-models.ts from data.html
```

`npm run extract-models` はデフォルトで `data.html` を読みます。別ファイルを使う場合はパスを渡します。
同じモデル名が複数行ある場合は、最も高いスコアの行だけを抽出します。価格が `N/A` のモデルは価格を `0` として出力します。
`--write` を指定すると、抽出したモデルの Arena Score とモデル一覧を `app/data/llm-models.ts` に反映します。既存モデルの provider、OpenRouter slug、deprecated 設定は維持されます。

```bash
npm run extract-models -- ./path/to/data.html
```

## Updating Model Data

1. `app/data/llm-models.ts` の `LLM_MODELS` にモデル、provider、Arena Score を追加または更新します。
2. 価格や throughput を取得するモデルは、`app/data/llm-models.ts` のモデル定義に `openrouterSlug` を追加します。
3. モデルの provider を追加する場合は、`app/data/llm-definitions.ts` の `Provider` 型、`PROVIDER_COLORS`、`PROVIDER_LABELS` も更新します。
4. 変更後に検証コマンドを実行します。

```bash
npm run typecheck
npm run lint
npm run build
```

## Notes

- このアプリは Next.js App Router と Recharts を使っています。
- OpenRouter の価格と throughput は 10分間キャッシュされます。
- 価格ゼロのモデルは、価格軸の表示や Pareto 計算から除外される場合があります。
- `AGENTS.md` の指示通り、Next.js の挙動を確認する場合は `node_modules/next/dist/docs/` のローカルドキュメントを参照してください。
