import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { execSync } from "child_process";

export interface Ec2InstanceOptions {
    instanceName: string;
    projectName: string;
    environment: string;
    toolchain: string;
    amiId: pulumi.Input<string>;
    instanceType: string;
    subnetId: string;
    securityGroupId: string;
    iamInstanceProfile: string;
    volumeSize: number;
    costCenter: string;
    owner: string;
}

/**
 * Git commit hashを取得
 */
function getGitCommitHash(): string {
    try {
        return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    } catch (error) {
        console.warn("⚠ Failed to get git commit hash");
        return "unknown";
    }
}

/**
 * EC2インスタンスを作成
 */
export function createDevInstance(
    name: string,
    options: Ec2InstanceOptions
): aws.ec2.Instance {
    const gitCommitHash = getGitCommitHash();

    return new aws.ec2.Instance(name, {
        ami: options.amiId,
        instanceType: options.instanceType,
        subnetId: options.subnetId,
        vpcSecurityGroupIds: [options.securityGroupId],
        iamInstanceProfile: options.iamInstanceProfile,
        rootBlockDevice: {
            volumeSize: options.volumeSize,
            volumeType: "gp3",
            deleteOnTermination: true
        },
        tags: {
            // 既存タグ（instance-provisioningから継承）
            Name: options.instanceName,
            ProvisioningRepositoryVersion: gitCommitHash,
            ProvisionedBy: "dev-env-iac",
            Role: options.iamInstanceProfile,
            SSMEnabled: "true",
            SSMManaged: "true",

            // 新規タグ（案件管理用）
            Project: options.projectName,
            Environment: options.environment,
            Toolchain: options.toolchain,
            CostCenter: options.costCenter,
            Owner: options.owner,
            ProvisionedAt: new Date().toISOString(),

            // AMIトラッキング
            BaseAmiId: options.amiId
        }
    });
}
