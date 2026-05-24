import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface SecurityGroupOptions {
    projectName: string;
    environment: string;
    vpcId: string;
}

/**
 * 案件別SecurityGroupを作成
 * アウトバウンド: 443のみ（Session Manager用）
 */
export function createProjectSecurityGroup(
    name: string,
    options: SecurityGroupOptions
): aws.ec2.SecurityGroup {
    const { projectName, environment, vpcId } = options;

    return new aws.ec2.SecurityGroup(name, {
        name: `${projectName}-${environment}-dev-sg`,
        description: `Security group for ${projectName} ${environment} development`,
        vpcId: vpcId,

        // アウトバウンド: 443のみ
        egress: [{
            fromPort: 443,
            toPort: 443,
            protocol: "tcp",
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTPS for Session Manager and package downloads"
        }],

        tags: {
            Name: `${projectName}-${environment}-dev-sg`,
            Project: projectName,
            Environment: environment,
            ManagedBy: "dev-env-iac"
        }
    });
}
