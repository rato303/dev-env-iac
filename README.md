# dev-env-iac

複数案件を管理する開発環境Infrastructure as Code (IaC)リポジトリ

## 概要

このリポジトリは、副業ベースで複数案件を非連続的に請け負う開発者向けに設計されたIaCツールセットです。

### 主な特徴

- **複数案件の論理的分離**: 案件ごとに開発環境を完全分離、コスト管理とセキュリティを確保
- **素早い作成・破棄サイクル**: カスタムAMIベイクによる高速起動（初回15分→2回目以降3分）
- **Windows 11対応**: VSCode/IntelliJ IDEAからSSH over SSMで接続
- **コスト最適化**: 共有VPC + タグ分離、自動停止機能

### 技術スタック

- **Pulumi**: TypeScript によるInfrastructure as Code
- **Ansible**: 開発環境のプロビジョニング
- **AWS Session Manager**: SSH鍵管理不要のセキュアな接続
- **カスタムAMI**: 事前ビルドによる高速起動

## 前提条件

- AWS アカウント
- AWS CLI v2
- Pulumi CLI
- Node.js 18以上
- Python 3.x + Ansible
- (Windows環境) Session Manager Plugin

## クイックスタート

### 1. 初回セットアップ

```bash
# リポジトリをクローン
git clone <repository-url> dev-env-iac
cd dev-env-iac

# 基本構造の確認
make help
```

### 2. プロジェクト定義

`config/projects.yaml` を編集して案件を追加:

```yaml
projects:
  client-a:
    name: "Client A Project"
    environments:
      - dev
    toolchain: web-dev
    cost_center: "client-a"
    owner: "user@example.com"
    vpc_id: "vpc-xxxxxxxxx"
    subnet_id: "subnet-xxxxxxxxx"
```

### 3. プロジェクト一覧

```bash
make list
```

## ディレクトリ構造

```
dev-env-iac/
├── README.md              # このファイル
├── Makefile               # トップレベルコマンド
├── config/                # プロジェクト設定
│   ├── projects.yaml      # 案件定義
│   └── defaults.yaml      # デフォルト設定
├── iac/
│   ├── pulumi/            # Pulumi Infrastructure
│   └── ansible/           # Ansible Playbooks
├── scripts/               # ヘルパースクリプト
└── windows/               # Windows用ツール
```

## 実装フェーズ

### Phase 1: 基盤構築（現在）🔄 60%

- [x] 基本ディレクトリ構造
- [x] プロジェクト設定ファイル（projects.yaml, defaults.yaml）
- [x] トップレベルMakefile
- [x] instance-provisioningからのファイルコピー
- [x] Ansibleロール整理（common/web-dev/jvm-dev）
- [x] Ansible provision.yml更新（ツールチェーン選択）
- [ ] Pulumiプロジェクトテンプレート
- [ ] カスタムAMIベイク機構
- [ ] ヘルパースクリプト（list-instances.sh, init-project.sh）

### Phase 2: Windows統合（予定）

- [ ] PowerShellスクリプト
- [ ] SSH設定自動生成
- [ ] VSCode/IntelliJ IDEA統合

### Phase 3: ECSタスク化（予定）

- [ ] Dockerコンテナイメージ
- [ ] ECSタスク定義
- [ ] Fargateによる自動プロビジョニング

## 参照元

このリポジトリは [`instance-provisioning`](../instance-provisioning) の設計を継承しています：

- IAMロール体系（WebBasicDeveloper/WebSuperDeveloper）
- Session Manager完全移行
- 粒度の細かいAnsibleロール
- Git commit hashトラッキング

## ライセンス

MIT License

## 関連リンク

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [Ansible Documentation](https://docs.ansible.com/)
- [AWS Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
