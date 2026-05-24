# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際の基本方針を定義します。

## プロジェクトの性質

このリポジトリは、**複数プロジェクトを非連続的に実施する開発者**向けの開発環境IaCです。

### 目的
- 案件ごとに開発環境を完全分離（コスト管理とセキュリティ確保）
- 素早い作成・破棄サイクル（カスタムAMIベイクで初回15分→2回目以降3分）
- タグベースの案件追跡とコスト配分

### 言語規約
- **コメント・ドキュメント**: 日本語
- **コード識別子**: 英語
- この規約はすべてのコードとドキュメントに適用

## 重要な設計原則

### 1. Session Manager専用アクセス
- **全インスタンスはSession Manager経由でのみアクセス可能**
- SSH鍵は使用しない、インバウンドセキュリティグループルールも設定しない
- アウトバウンドは443（HTTPS）とDNS（UDP/TCP 53）のみ許可

### 2. タグベースのリソース管理
すべてのリソースに以下のタグを必ず付与：
- `Project`: 案件識別子（config/projects.yamlのキー）
- `Environment`: 環境（dev/staging/prod）
- `Toolchain`: ツールチェーン種別（web-dev/jvm-dev）
- `CostCenter`: コスト配分先
- `Owner`: 管理者メールアドレス
- `ManagedBy`: "dev-env-iac"（固定値）

### 3. カスタムAMI戦略
- `modules/ami.ts`の`getBaseAmi()`は、`ManagedBy=dev-env-iac` + `Toolchain=<name>`でタグ付けされたカスタムAMIを優先検索
- カスタムAMIが存在しない場合、Canonical Ubuntu 24.04（Noble）にフォールバック
- AMI IDは常にタグ`BaseAmiId`に記録

### 4. Pulumiバックエンド設定
- S3バックエンドのURLとリージョンは**SSM Parameter Store**（`/pulumi/backend/url`、`/pulumi/backend/region`）に保存
- 全PulumiプロジェクトのMakefileはSSMから設定を取得
- スタックはパスフレーズなし（`PULUMI_CONFIG_PASSPHRASE=""`）で開発利便性を優先

## アーキテクチャ概要

### 3層構造
1. **設定層**（`config/`）: プロジェクト定義（projects.yaml）とデフォルト設定（defaults.yaml）
2. **Pulumi層**（`iac/pulumi/`）: インフラストラクチャ定義
   - `shared/`: 共有リソース（IAMロール、バックエンド設定）
   - `projects/template/`: 新規案件用テンプレート
3. **Ansible層**（`iac/ansible/`）: 開発環境のプロビジョニング
   - ツールチェーン別ロール（common/web-dev/jvm-dev）

### ツールチェーン分離
- **web-dev**: Node.js/TypeScript開発（nvm、pulumi）
- **jvm-dev**: JVM言語開発（sdkman）
- **common**: 全環境共通（awscli、make、docker、ansible、git-switch-user）

## 開発時の留意点

### 新規プロジェクト追加時
1. `config/projects.yaml`に案件定義を追加（既存の書式を踏襲）
2. `iac/pulumi/projects/template/infra/`をコピーして新規プロジェクトディレクトリを作成
3. コピーしたプロジェクトの`Pulumi.yaml`と`package.json`の`name`フィールドを更新
4. スタック設定（`Pulumi.<stack>.yaml`）で、`projectName`、`vpcId`、`subnetId`、`toolchain`を設定

### 既存プロジェクトの修正時
- **タグの一貫性を維持**: 新しいリソースにも必ず上記6つのタグを付与
- **AMI検索ロジックを変更しない**: カスタムAMI優先、Ubuntu フォールバックのパターンを維持
- **Makefileのパターンを踏襲**: `PULUMI_CONFIG_PASSPHRASE=""`の設定、`login-to-backend.sh`の使用

### Git管理
- EC2インスタンスには`ProvisioningRepositoryVersion`タグでGitコミットハッシュを記録（`modules/ec2.ts`の`getGitCommitHash()`）
- これによりインフラとコードのバージョン追跡が可能

### コマンドの確認方法
- 具体的なコマンドやワークフローは`README.md`を参照
- 各ディレクトリの`Makefile`で`make help`を実行してコマンド一覧を確認
