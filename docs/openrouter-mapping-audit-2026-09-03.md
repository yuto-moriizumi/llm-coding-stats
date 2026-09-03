# OpenRouter対応修正の調査結果（2026-09-03）

## 追記: ユーザー指定による7件のdeprecated化

以下の調査後、ユーザーが残る7件すべてをdeprecated扱いにすることを明示指定したため、Codeレジストリに `deprecated: true` を設定した。これはアプリ上の扱いの決定であり、全提供元が公式に廃止を発表したという意味ではない。モデル名・スコアは保持し、Chatレジストリは変更していない。

変更後のライブ検証は **価格あり114件・deprecated 16件・blocked 0件**。typecheck・lint・diff checkも成功。以下はdeprecated化前の調査記録として残す。

対象: Codeレジストリで検出された27件。20件の `openrouterSlug` を修正し、確認済みマッピングにも記録した。Arena名・スコア・provider・deprecatedフラグ・順序は変更していない。Chatは対象外。

## 修正した20件

各リンク先のモデル説明を、[Arena Code](https://arena.ai/leaderboard/code)のリンク先・モデル情報と照合した。修正後、[ライブカタログ](https://openrouter.ai/api/v1/models)で20件すべての価格取得と、アプリの1Mトークン換算・小数点2桁丸め後の正価格を確認した。ブラウザ表示・本番デプロイの確認ではない。

| Arena名 | 修正後のOpenRouter ID・確認先 | 判断根拠 |
| --- | --- | --- |
| grok-4.6-high | [x-ai/grok-4.6](https://openrouter.ai/x-ai/grok-4.6) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| qwen3.8-flash-next | [qwen/qwen3.8-flash](https://openrouter.ai/qwen/qwen3.8-flash) | [Qwen公式](https://qwen.ai/blog?id=qwen3.8-flash-next)がAPI提供名をQwen3.8-Flashと明記。 |
| glm-5.3-max | [z-ai/glm-5.3](https://openrouter.ai/z-ai/glm-5.3) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| deepseek-v4-pro-high-20260813 | [deepseek/deepseek-v4-pro-0813](https://openrouter.ai/deepseek/deepseek-v4-pro-0813) | Arenaは2026-08-13更新を参照。別の0423版ではなく0813版を選択。 |
| claude-opus-4-8-high | [anthropic/claude-opus-4.8](https://openrouter.ai/anthropic/claude-opus-4.8) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| claude-opus-4-7-high | [anthropic/claude-opus-4.7](https://openrouter.ai/anthropic/claude-opus-4.7) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| claude-opus-4-6-high | [anthropic/claude-opus-4.6](https://openrouter.ai/anthropic/claude-opus-4.6) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| muse-spark-1.2 (xHigh) | [meta/muse-spark-1.2](https://openrouter.ai/meta/muse-spark-1.2) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| claude-opus-4-5-20251101-high-32k | [anthropic/claude-opus-4.5](https://openrouter.ai/anthropic/claude-opus-4.5) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| kimi-k2.7-code | [moonshotai/kimi-k2.7-code](https://openrouter.ai/moonshotai/kimi-k2.7-code) | Arenaのモデル名・提供元・バージョンをOpenRouterのモデル説明と照合。別世代や小型版には置換しない。 |
| inkling | [thinkingmachines/inkling](https://openrouter.ai/thinkingmachines/inkling) | Arenaのモデル名・提供元・バージョンをOpenRouterのモデル説明と照合。別世代や小型版には置換しない。 |
| Inkling Small | [thinkingmachines/inkling-small](https://openrouter.ai/thinkingmachines/inkling-small) | Arenaのモデル名・提供元・バージョンをOpenRouterのモデル説明と照合。別世代や小型版には置換しない。 |
| claude-sonnet-4-5-20250929-high-32k | [anthropic/claude-sonnet-4.5](https://openrouter.ai/anthropic/claude-sonnet-4.5) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| solar-pro4 | [upstage/solar-pro4](https://openrouter.ai/upstage/solar-pro4) | Arenaのモデル名・提供元・バージョンをOpenRouterのモデル説明と照合。別世代や小型版には置換しない。 |
| muse-glimmer | [meta/muse-glimmer-30b](https://openrouter.ai/meta/muse-glimmer-30b) | [Meta公式](https://research.meta.ai/blog/introducing-muse-glimmer-open-agentic-model)がMuse Glimmerを30Bモデルと明記。 |
| hunyuan-hy3-preview | [tencent/hy3-preview](https://openrouter.ai/tencent/hy3-preview) | Arenaのモデル名・提供元・バージョンをOpenRouterのモデル説明と照合。別世代や小型版には置換しない。 |
| claude-haiku-4-5-20251001 | [anthropic/claude-haiku-4.5](https://openrouter.ai/anthropic/claude-haiku-4.5) | Arenaのモデルリンク・バージョンとOpenRouterの推論対応モデルを照合。推論設定ラベルをArena名として保持。 |
| qwen3-coder-480b-a35b-instruct | [qwen/qwen3-coder](https://openrouter.ai/qwen/qwen3-coder) | Arenaのモデル名・提供元・バージョンをOpenRouterのモデル説明と照合。別世代や小型版には置換しない。 |
| qwen3.5-flash | [qwen/qwen3.5-flash-02-23](https://openrouter.ai/qwen/qwen3.5-flash-02-23) | Arenaのモデル名・提供元・バージョンをOpenRouterのモデル説明と照合。別世代や小型版には置換しない。 |
| devstral-2 | [mistralai/devstral-2512](https://openrouter.ai/mistralai/devstral-2512) | Arenaのモデル名・提供元・バージョンをOpenRouterのモデル説明と照合。別世代や小型版には置換しない。 |

## 未解決7件（ID置換だけでは表示を復旧できない）

- `seed-2.1-pro-preview`: 現行カタログに対応モデルなし。旧IDと `bytedance-seed/seed-2.1-pro-preview` のendpoints APIは404。[公式発表](https://seed.bytedance.com/en/blog/seed-2-1-preview-model-release-on-arena)はArena/Feishu Spark/Cozeへの提供を説明しており、[Seed 2.1 Turbo](https://openrouter.ai/bytedance-seed/seed-2-1-turbo)を同一モデルとして代用する根拠にはならない。
- `mimo-v2-pro`: [モデルページ](https://openrouter.ai/xiaomi/mimo-v2-pro)は存在するが、[endpoints API](https://openrouter.ai/api/v1/models/xiaomi/mimo-v2-pro/endpoints)はHTTP 200、endpointsは空。MiMo-V2.5-Proは別バージョンのため代用しない。
- `mimo-v2-flash (thinking)` と `mimo-v2-flash (non-thinking)`: [モデルページ](https://openrouter.ai/xiaomi/mimo-v2-flash)は推論切替可能な同一モデルであることを説明するが、[endpoints API](https://openrouter.ai/api/v1/models/xiaomi/mimo-v2-flash/endpoints)はHTTP 200、endpointsは空。
- `laguna-m.1`: [モデルページ](https://openrouter.ai/poolside/laguna-m.1/providers)は存在するが、[endpoints API](https://openrouter.ai/api/v1/models/poolside/laguna-m.1/endpoints)はHTTP 200、endpointsは空。
- `laguna-xs.2`: [モデルページ](https://openrouter.ai/poolside/laguna-xs.2)は存在するが、[endpoints API](https://openrouter.ai/api/v1/models/poolside/laguna-xs.2/endpoints)はHTTP 200、endpointsは空。[XS 2.1](https://openrouter.ai/poolside/laguna-xs-2.1)はXS.2からの後継と説明されており、別バージョン。両Lagunaの元モデルは[Poolside公式発表](https://poolside.ai/blog/introducing-laguna-xs2-m1)とも照合した。
- `devstral-medium-2507`: [OpenRouter](https://openrouter.ai/mistralai/devstral-medium)ではcanonical IDが `mistralai/devstral-medium`。旧ID・canonical IDの[API](https://openrouter.ai/api/v1/models/mistralai/devstral-medium/endpoints)は同じモデルを返すがendpointsは空、価格付きカタログにもない。[Mistral公式](https://docs.mistral.ai/models/devstral-medium-1-0-25-07)は2026-02-27の廃止を明記。別モデルの価格に置換せず、deprecatedフラグも今回の修正では変更していない。

API提供状況は調査時点の観測であり、永久に提供されないという意味ではない。7件を表示するには、価格未取得モデルを別枠表示するなど、アプリ側の扱いについて追加判断が必要。価格の捏造・他モデルへの置換・検証回避は行っていない。

## 検証

- ライブdry run: 123 Arenaモデルを解析、130登録中123件一致。スコア変更0、新規追加0。
- Vote cutoff: 2026-09-02 12:00 UTC、640,806票。
- 価格あり114件（修正前94件）、既存deprecated 9件、未解決7件。全体のvisibility gateは未通過。
- Arenaに一致しない既存7件はそのまま保持: `claude-opus-4-5-20251101-thinking-32k`, `claude-opus-4-6-thinking`, `claude-opus-4-7-thinking`, `claude-opus-4-8-thinking`, `claude-sonnet-4-5-20250929-thinking-32k`, `gemini-3.5-flash`, `gemini-3.6-flash`。これは上記の価格未取得7件とは別。
- typecheck、lint、回帰テスト14件、diff whitespace check成功。
