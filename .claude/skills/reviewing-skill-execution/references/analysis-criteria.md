# スキル実行分析基準

このドキュメントは、`reviewing-skill-execution` スキルがスキル実行の品質を評価する際の具体的な分析基準を定義します。

## 分析の3つの観点

### 1. 効率性（Efficiency）

スキルがトークンとツール呼び出しを最適に使用しているかを評価します。

#### 1.1 重複ファイル読み込み

**検出パターン**:
- 同じファイルパスに対する複数の `Read` tool call
- 同一Phase内での重複読み込み
- Phase間での重複読み込み（キャッシュ可能な場合）

**判定基準**:
- **High**: 同一ファイルを3回以上読み込み
- **Medium**: 同一ファイルを2回読み込み
- **Low**: Phase間で読み込むが、データ更新の可能性がある

**トークン削減効果の見積もり**:
```
削減トークン = (重複回数 - 1) × ファイルサイズ（文字数）
削減率 = 削減トークン / 総トークン使用量
```

**改善提案**:
```markdown
**Before**:
1. Phase 1でファイルAを読み込み
2. Phase 2でファイルAを再度読み込み
3. Phase 3でファイルAを再度読み込み

**After**:
1. Phase 1でファイルAを読み込み、変数に格納
2. Phase 2-3では変数を参照
```

#### 1.2 直列実行の非効率

**検出パターン**:
- 独立したBash tool callが複数メッセージに分割されている
- 依存関係がないツール呼び出しが順次実行されている

**判定基準**:
- **High**: 5個以上の独立したtool callが直列実行
- **Medium**: 3-4個の独立したtool callが直列実行
- **Low**: 2個の独立したtool callが直列実行

**改善提案**:
```markdown
**Before**:
```xml
<function_calls>
<invoke name="Bash">
<parameter name="command">gh issue view 22 --json number,title</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="Bash">
<parameter name="command">git branch --show-current</parameter>
</invoke>
</function_calls>
```

**After**:
```xml
<function_calls>
<invoke name="Bash">
<parameter name="command">gh issue view 22 --json number,title</parameter>
</invoke>
<invoke name="Bash">
<parameter name="command">git branch --show-current</parameter>
</invoke>
</function_calls>
```
```