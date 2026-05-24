# スキル設計ベストプラクティス

このドキュメントは、dev-env-iacプロジェクトのスキル設計における推奨パターンとアンチパターンを定義します。

## 並列実行パターン

### パターン1: 独立したデータ取得の並列化

**推奨**: 依存関係のない複数のコマンドは、1つの `<function_calls>` ブロック内で並列実行

**利点**:
- 実行時間の短縮
- ユーザー体験の向上（待ち時間削減）
- トークン効率は同じ（並列化自体でトークンは削減されないが、実行速度が向上）

**例**: Issue情報とGit状態の取得
```
SKILL.mdでの記述:
「以下のコマンドを**並列実行**してissue情報とリポジトリ状態を取得します」

実装: 3つのBash tool callを1つのfunction_callsブロックで実行
- gh issue view
- git branch --show-current
- git status --short
```

**アンチパターン**: 順次実行
```
❌ 悪い例:
1. gh issue viewを実行
2. 結果を待つ
3. git branchを実行
4. 結果を待つ
5. git statusを実行

✅ 良い例:
1. 3つのコマンドを並列実行
2. すべての結果を同時に取得
```

### パターン2: ファイル読み込みの並列化

**推奨**: 複数の参考ファイルを読み込む場合、依存関係がなければ並列実行

**例**: 複数のスキルファイル参照
```
実装: 3つのRead tool callを並列実行
- .claude/skills/creating-issue/SKILL.md
- .claude/skills/planning-from-issue/SKILL.md
- CLAUDE.md
```

**注意**: 読み込んだ内容を統合して処理する場合でも、読み込み自体は並列実行可能

## ファイルI/O最適化パターン

### パターン3: 一度だけ読み込む（Read Once）

**原則**: 同じファイルを複数回読み込まない

**実装戦略**:
1. **Phase 1でデータ取得を集約**
   - すべての必要なファイルをPhase 1で読み込み
   - データを変数に格納（スキル実行中は保持される）

2. **Phase 2-4では変数を参照**
   - ファイルシステムに再度アクセスしない
   - 読み込んだ内容を再利用

**例**:
```
Phase 1: issue内容の準備
- ファイルAを読み込み → 変数contentに格納

Phase 2: issueテンプレートの適用
- 変数contentを参照してテンプレート選択

Phase 3: issueメタデータの設定
- 変数contentを参照してラベル判定
```

**トークン削減効果**:
- 3000文字のファイルを3回読む場合: 約9000トークン
- 1回だけ読む場合: 約3000トークン
- 削減: 約6000トークン（67%削減）

### パターン4: 部分読み込み（Offset/Limit活用）

**推奨**: 大きなファイルの一部だけが必要な場合、offset/limitパラメータを使用

**例**: プランファイルのメタデータセクションのみ読み込み
```
悪い例（全体を読み込む）:
Read(file_path="~/.claude/plans/issue-22-xxx.md")
→ 5000行すべて読み込み

良い例（末尾のみ読み込む）:
Read(file_path="~/.claude/plans/issue-22-xxx.md", offset=4900, limit=100)
→ 最後の100行のみ読み込み（メタデータセクションが末尾にあるため）
```

**注意**: この最適化は、ファイル構造が既知の場合のみ有効

## エラーハンドリングパターン

### パターン5: 事前チェック（Fail Fast）

**原則**: エラーが予測できる場合、実行前にチェック

**実装**:
```
Phase 1: 前提条件の確認
1. gh CLIがインストールされているか確認
   command -v gh >/dev/null 2>&1

2. GitHub認証が有効か確認
   gh auth status

3. Gitリポジトリ内か確認
   git rev-parse --is-inside-work-tree

→ すべてOKなら Phase 2へ
→ NGなら明確なエラーメッセージを出力して終了
```

**利点**:
- 早期にエラーを検出
- ユーザーに明確な対処法を提示
- 無駄なトークン消費を防ぐ

### パターン6: 明確なエラーメッセージ

**原則**: エラーメッセージは「何が問題か」「なぜ問題か」「どう対処するか」を含む

**テンプレート**:
```markdown
{問題の説明}

{原因または背景}

{対処方法}:
  {具体的なコマンドまたは手順}
```

**例**:
```markdown
Issue #999 not found in this repository.

Please verify:
- Issue number is correct
- You are in the correct repository
- Issue is not deleted

Run 'gh issue list' to see available issues.
```

### パターン7: 回復可能なエラーへの対応

**原則**: エラーから回復可能な場合、ユーザーに選択肢を提示

**例**: プランファイルが既に存在する場合
```markdown
Plan file already exists: ~/.claude/plans/issue-22-xxx.md

Options:
1. Overwrite existing plan
2. Create versioned plan: issue-22-xxx-v2.md
3. View existing plan
4. Cancel

[Select option: 1/2/3/4]
```

## ユーザーフィードバックパターン

### パターン8: 進捗の明示

**原則**: 長時間実行される処理では、進捗を明示

**実装**:
```markdown
Phase 1: データ収集中...
✓ Issue情報取得完了

Phase 2: プラン生成中...
✓ 要件抽出完了
✓ ファイル構造分析完了
✓ プラン構造生成完了

Phase 3: ファイル書き込み中...
✓ プランファイル作成完了

完了: ~/.claude/plans/issue-22-xxx.md
```

**注意**: 過度な進捗表示は冗長になるため、主要なマイルストーンのみ表示

### パターン9: 結果サマリーの提示

**原則**: 実行完了時に、結果の要約と次のステップを提示

**テンプレート**:
```markdown
{実行結果サマリー}:
- {指標1}: {値}
- {指標2}: {値}

Next steps:
1. {次のアクション1}
2. {次のアクション2}
```

**例**:
```markdown
Plan created: ~/.claude/plans/issue-22-xxx.md

Summary:
- Files to create: 4
- Files to modify: 0
- Implementation phases: 4
- Complexity: Medium

Next steps:
1. Review plan: cat ~/.claude/plans/issue-22-xxx.md
2. Start implementation: git checkout -b feature/xxx
3. Or execute with: /executing-plan issue-22-xxx.md
```

### パターン10: 不要な確認プロンプトの削減

**原則**: 明らかに安全な操作には確認を求めない

**確認が必要な操作**:
- 破壊的操作（ファイル削除、force push）
- 外部への影響（PR作成、issue作成）
- 既存データの上書き

**確認が不要な操作**:
- ファイル読み込み
- 新規ファイル作成（既存ファイルがない場合）
- Git status/log/diffの実行

**アンチパターン**:
```
❌ 過度な確認:
「ファイルを読み込みますか？ [y/n]」
「git statusを実行しますか？ [y/n]」

✅ 適切な確認:
「既存のプランファイルを上書きしますか？ [y/n]」
「PRを作成しますか？ [y/n]」
```

## 規約準拠パターン

### パターン11: CLAUDE.mdの規約参照

**原則**: プロジェクト固有の規約は `CLAUDE.md` に定義し、スキルはそれを参照

**実装**:
```markdown
## プロジェクト固有の規約

### コミットメッセージ形式

CLAUDE.mdの「コミット規約」セクションに準拠：
- プレフィックス: feat/fix/docs/refactor/chore/test
- 形式: {prefix}: {要約}
- Co-Authored-Byタグを必ず付与
```

### パターン12: 一貫性のある命名規則

**原則**: ファイル名、ブランチ名、スラグは統一されたslugify規則を使用

**規則**:
```
1. 小文字化
2. 英数字以外をハイフンに置換
3. 連続ハイフンを1つに統合
4. 前後のハイフン削除
5. 最大50文字に制限
```

**例**:
- "機能: スキル実行後の改善点確認スキルの実装" → `skill-execution-review-implementation`
- Issue #22 → プランファイル: `issue-22-skill-execution-review-implementation.md`
- ブランチ: `feature/skill-execution-review`

## トークン効率パターン

### パターン13: 簡潔なSKILL.md記述

**原則**: SKILL.mdは詳細すぎず、必要十分な情報のみ記述

**含めるべき情報**:
- ワークフロー（Phase 1-4）
- エラーハンドリング
- 使用例（2-3個）
- プロジェクト固有の規約

**含めないべき情報**:
- 実装の詳細（コード例が過度に長い）
- 自明な説明（「Read toolはファイルを読み込みます」等）
- 冗長な繰り返し

**目安**: SKILL.mdは1500-3000文字程度が適切（5000文字を超えると冗長）

### パターン14: リファレンスファイルの活用

**原則**: 詳細情報はSKILL.mdではなく `references/` に分離

**構造**:
```
.claude/skills/{skill-name}/
├── SKILL.md               # 概要とワークフロー（必須情報のみ）
├── references/
│   ├── workflow.md        # 詳細なワークフロー解説
│   ├── examples.md        # 追加の使用例
│   └── troubleshooting.md # トラブルシューティング
└── templates/
    └── output-format.md   # 出力フォーマット定義
```

**利点**:
- SKILL.md自体のトークン消費を削減
- 必要に応じて詳細ファイルを読み込める
- メンテナンス性の向上

## 実行速度パターン

### パターン15: キャッシュ可能なデータの再利用

**原則**: 実行中に不変なデータは、一度取得したら再利用

**例**:
- CLAUDE.mdの内容（プロジェクト規約）
- Issue本文（実行中に変更されない）
- Gitログ（過去のコミットは不変）

**実装**:
```
Phase 1でキャッシュ:
- CLAUDE.md → 変数project_rulesに格納
- Issue #22 → 変数issue_dataに格納

Phase 2-4で再利用:
- 規約確認 → project_rulesを参照
- Issue情報 → issue_dataを参照
```

### パターン16: 遅延読み込み（Lazy Loading）

**原則**: 使用されない可能性のある情報は、必要になるまで読み込まない

**例**: エラー時のみ必要な情報
```
Phase 1: 基本チェック
- Issue番号の妥当性確認

エラーが発生した場合のみ:
- gh issue listで全Issue一覧を取得
- ユーザーに候補を提示
```

**利点**:
- 正常系のトークン消費を削減
- エラー時のみ追加情報を取得

## まとめ

これらのベストプラクティスを適用することで、スキルは以下を実現します：

1. **効率性**: トークン使用量を30-50%削減
2. **品質**: 規約準拠、堅牢なエラーハンドリング
3. **ユーザー体験**: 高速実行、明確なフィードバック、最小限の確認プロンプト

スキル設計時には、このドキュメントを参照し、各パターンの適用可否を検討してください。
