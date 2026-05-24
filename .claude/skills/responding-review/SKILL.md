---
name: responding-review
description: GitHub PRのレビュー指摘に対応します。ユーザーが「レビュー指摘に対応」「レビューコメントを確認」「指摘を修正」「レビュー対応」と言及した場合、または明示的にPRレビューの指摘に対応したい場合に使用します。このプロジェクト（dev-env-iac）の規約に従った対応コミットとレビューコメントへの返信を生成します。
version: 1.0.0
tools: Read, Bash, Edit
---

# PRレビュー指摘対応スキル

このスキルは、dev-env-iacプロジェクトでGitHub PRのレビュー指摘に対応するプロセスを自動化します。

## ワークフロー

### Phase 1: レビューコメントの取得

以下のコマンドを**並列実行**してPRの状態とレビューコメントを取得します：

1. `gh pr view {PR番号} --json number,title,state,url,headRefName` - PR情報を取得
2. `gh api repos/{owner}/{repo}/pulls/{PR番号}/comments` - レビューコメント一覧を取得
3. `git branch --show-current` - 現在のブランチ名を確認

**出力**:
- PR番号、タイトル、状態、URL
- レビューコメント一覧（ID、ファイルパス、行番号、本文、レビュワー）
- 現在のブランチ名

### Phase 2: 指摘内容の解析と対応方針確認

1. **レビューコメントを構造化**：
   - ファイルパスごとにグループ化
   - 指摘の種類を分類（バグ、命名、ドキュメント、リファクタリング等）
   - 各コメントに番号を付けて一覧表示

2. **ユーザーに確認**：
   - 各指摘の内容を要約して表示
   - 「どの指摘に対応しますか？」と確認（複数選択可能）

3. **対応範囲の決定**：
   - ユーザーが選択した指摘のみを対応対象とする
   - 対応方針を明確化

### Phase 3: 対応コミットの作成

1. **ファイル修正**：
   - 選択された各指摘に対してファイルを修正（Editツール使用）
   - 修正内容をユーザーに確認

2. **コミットメッセージ生成**：
   ```
   fix: レビュー指摘対応 - <要約>
   
   - <ファイル名>: <修正内容1>
   - <ファイル名>: <修正内容2>
   
   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```

3. **コミット作成**：
   ```bash
   git add <修正ファイル>
   git commit -m "$(cat <<'EOF'
   <コミットメッセージ>
   EOF
   )"
   ```

4. **プッシュ**：
   ```bash
   git push
   ```

### Phase 4: レビューコメントへの返信

**重要**: **`POST .../replies`** エンドポイントを使用（PATCHは使わない）

1. **コミットハッシュ取得**：
   ```bash
   git log -1 --format=%H
   ```

2. **各コメントに返信**：
   ```bash
   gh api repos/{owner}/{repo}/pulls/{PR番号}/comments/{comment_id}/replies \
     -f body="ご指摘ありがとうございます。

   <対応内容の説明>

   対応コミット: <commit-hash>"
   ```

3. **レビューコメントのResolve**：
   ```bash
   # thread IDを取得
   gh api graphql -f owner={owner} -f repo={repo} -F pr={PR番号} -f query='
     query($owner: String!, $repo: String!, $pr: Int!) {
       repository(owner: $owner, name: $repo) {
         pullRequest(number: $pr) {
           reviewThreads(first: 10) {
             nodes {
               id
               isResolved
               comments(first: 1) {
                 nodes {
                   databaseId
                 }
               }
             }
           }
         }
       }
     }
   '
   
   # 各スレッドをResolve
   gh api graphql -f query='
     mutation {
       resolveReviewThread(input: {threadId: "<thread_id>"}) {
         thread {
           id
           isResolved
         }
       }
     }
   '
   ```

4. **返信完了確認**：
   - 各コメントに返信が投稿されたことを確認
   - 各スレッドがResolveされたことを確認
   - ユーザーに「レビュー対応完了: <数>件返信、<数>件Resolve」と報告

## エラーハンドリング

### PRが見つからない

**検出方法**:
```bash
gh pr view <PR番号>
```

**エラーメッセージ**:
```
PR #{番号} が見つかりません。

PR番号を確認してください。または、リポジトリが正しいか確認してください。
```

### レビューコメントがない

**検出方法**:
レビューコメント取得結果が空の配列

**エラーメッセージ**:
```
PR #{番号} にレビューコメントがありません。

レビューコメントが投稿されているか確認してください。
```

### ブランチが一致しない

**検出方法**:
PRのheadRefNameと現在のブランチ名を比較

**エラーメッセージ**:
```
現在のブランチ（<現在のブランチ>）がPRのブランチ（<PRのブランチ>）と一致しません。

以下のコマンドで正しいブランチに切り替えてください:
  gh pr checkout {PR番号}
```

### コミットがプッシュできない

**検出方法**:
`git push` が非ゼロで終了

**エラーメッセージ**:
```
プッシュに失敗しました。

リモートブランチに新しいコミットがある可能性があります。
以下のコマンドでリモートの変更を取り込んでください:
  git pull --rebase

コンフリクトが発生した場合は解決してから再度プッシュしてください。
```

### API返信が失敗

**検出方法**:
`gh api` コマンドが非ゼロで終了

**エラーメッセージ**:
```
レビューコメントへの返信に失敗しました。
コメントID: <id>

考えられる原因:
- GitHub CLI の認証が切れている（gh auth login で再認証）
- コメントが既に削除されている
- ネットワークエラー
```

### Resolve権限エラー

**検出方法**:
`gh api graphql` で `resolveReviewThread` mutation が非ゼロで終了

**エラーメッセージ**:
```
レビューコメントのResolveに失敗しました。
Thread ID: <thread_id>

考えられる原因:
- Resolve権限がない（PRオーナーまたはコラボレーターのみ）
- スレッドが既に削除されている
- GitHub API エラー

返信は正常に投稿されました。スレッドは手動でResolveしてください。
```

## 使用例

### 例1: 全ての指摘に対応

**ユーザー**: "PR #8のレビュー指摘に対応して"

**スキルの動作**:
1. PR #8のレビューコメントを取得
2. 指摘内容を表示:
   ```
   PR #8: docs: CLAUDE.mdとREADME.md追加
   
   レビューコメント:
   [1] CLAUDE.md:28 (gemini-code-assist)
       Projectタグの説明が不明確です
   
   [2] CLAUDE.md:33 (gemini-code-assist)
       ManagedByとProvisionedByの表記が混在しています
   ```
3. ユーザーに確認: 「どの指摘に対応しますか？ [1, 2]」
4. ユーザーが選択: 「全て」
5. ファイルを修正:
   - CLAUDE.md:28 を「案件識別子（キー）」→「プロジェクト名（nameフィールド）」に修正
   - ec2.ts:56 を「ProvisionedBy」→「ManagedBy」に修正
6. コミット作成:
   ```
   fix: レビュー指摘対応 - タグ定義の明確化と統一
   
   - CLAUDE.md: Projectタグの説明を「キー」から「nameフィールド」に修正
   - ec2.ts: ProvisionedByタグをManagedByに統一
   
   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```
7. プッシュ
8. 各コメントに返信投稿

### 例2: 一部の指摘のみ対応

**ユーザー**: "PR #10の最初の指摘だけ対応して"

**スキルの動作**:
1. PR #10のレビューコメントを取得（3件）
2. 指摘内容を表示:
   ```
   [1] README.md:15 - タイポ修正
   [2] config/defaults.yaml:10 - フォーマット修正
   [3] iac/pulumi/projects/template/index.ts:20 - リファクタリング提案
   ```
3. ユーザーが「最初の指摘だけ」と指定
4. コメント[1]のみ修正
5. コミット作成: `fix: レビュー指摘対応 - README.mdタイポ修正`
6. プッシュ
7. コメント[1]にのみ返信投稿

### 例3: レビューコメントがない場合

**ユーザー**: "PR #12のレビュー指摘に対応して"

**スキルの動作**:
1. PR #12のレビューコメントを取得
2. コメントが0件
3. メッセージ: 「PR #12 にレビューコメントがありません。レビューコメントが投稿されているか確認してください。」

## プロジェクト固有の規約

### コミットメッセージ形式

- **プレフィックス**: `fix:` (レビュー指摘対応は通常バグ修正扱い)
- **本文**: 修正内容を箇条書き（ファイル名: 修正内容）
- **必須**: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

**良い例**:
```
fix: レビュー指摘対応 - タグ定義の明確化と統一

- CLAUDE.md: Projectタグの説明を修正
- ec2.ts: タグ名をManagedByに統一

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**悪い例**:
```
レビュー対応
```
（プレフィックスなし、詳細なし、Co-Authored-Byなし）

### レビューコメント返信形式

```markdown
ご指摘ありがとうございます。

<対応内容の説明（1-2文）>

対応コミット: <commit-hash>
```

**例**:
```markdown
ご指摘ありがとうございます。

CLAUDE.mdの記述を修正し、`Project` タグには `config/projects.yaml` の `name` フィールド（表示名）を使用することを明記しました。既存の実装がこの方針に沿っていることを確認しています。

対応コミット: 44e0a73604afabc875ff748d7b5b428b2852e76e
```

### ブランチ戦略

- **PRのheadブランチで作業**: 必ず `gh pr view` で取得したheadRefNameを確認
- **mainブランチから直接対応しない**: レビュー対応は常にフィーチャーブランチで実施

### GitHub API使用の重要な教訓

**❌ 絶対にやってはいけないこと**:
```bash
gh api --method PATCH repos/{owner}/{repo}/pulls/comments/{comment_id} \
  -f body="返信内容"
```
→ 元のレビューコメントを**上書き**してしまう（元の指摘内容が失われる）

**✅ 正しい方法**:
```bash
gh api repos/{owner}/{repo}/pulls/{PR番号}/comments/{comment_id}/replies \
  -f body="返信内容"
```
→ スレッドに**返信を追加**（元のコメントはそのまま残る）

この教訓はPR #8での実際の失敗経験から得られたものです。詳細は `references/workflow.md` を参照してください。

## 参考資料

詳細なワークフローとコマンドリファレンスは `references/workflow.md` を参照してください。
