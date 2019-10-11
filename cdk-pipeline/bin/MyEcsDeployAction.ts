// https://github.com/aws/aws-cdk/issues/4375

import codepipeline = require('@aws-cdk/aws-codepipeline');
import events = require('@aws-cdk/aws-events');
import iam = require('@aws-cdk/aws-iam');
import { Construct } from '@aws-cdk/core';

export interface MyEcsDeployActionProps extends codepipeline.CommonAwsActionProps {
  readonly input: codepipeline.Artifact;
  readonly serviceName: string;
  readonly clusterName: string
}

export class MyEcsDeployAction implements codepipeline.IAction {
  public readonly actionProperties: codepipeline.ActionProperties;
  private readonly props: MyEcsDeployActionProps;

  constructor(props: MyEcsDeployActionProps) {
    this.actionProperties = {
      ...props,
      category: codepipeline.ActionCategory.DEPLOY,
      provider: 'ECS',
      artifactBounds: { minInputs: 1, maxInputs: 1, minOutputs: 0, maxOutputs: 0 },
      inputs: [props.input],
    };

    this.props = props;
  }

  public bind(_scope: Construct, _stage: codepipeline.IStage, options: codepipeline.ActionBindOptions):
    codepipeline.ActionConfig {
    // you probably need all these permissions
    options.role.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecs:DescribeServices',
        'ecs:DescribeTaskDefinition',
        'ecs:DescribeTasks',
        'ecs:ListTasks',
        'ecs:RegisterTaskDefinition',
        'ecs:UpdateService',
      ],
      resources: ['*']
    }));

    options.role.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: ['*'],
      conditions: {
        StringEqualsIfExists: {
          'iam:PassedToService': [
            'ec2.amazonaws.com',
            'ecs-tasks.amazonaws.com',
          ],
        }
      }
    }));

    options.bucket.grantRead(options.role);

    return {
      configuration: {
        ClusterName: this.props.clusterName,
        ServiceName: this.props.serviceName,
        // FileName is imagedefinitions.json by default
      },
    };
  }

  public onStateChange(name: string, target?: events.IRuleTarget, options?: events.RuleProps): events.Rule {
    throw new Error("Method not implemented.");
  }
}