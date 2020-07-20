#!/usr/bin/env node

/*********************************************************
 * CUSTOMIZE THE BELOW CONSTANTS BEFORE USING THIS SCRIPT
 *********************************************************/

 const TAG = "-20200720";

// GitHub username and repo

//
// DO NOT FORGET TO CREATE A SECRET WITH GITHUB PERSONAL ACCESS TOKEN
//
const github = { 
    owner: "sebsto",
    repo: "ecs-demo",
    //TODO can we create the SM secret in this stack ?
    secret_manager_secret_name: "my-github-token"
}

// ECS cluster where to deploy 
// TODO : get serviceName and clusterName from output of the ECSStack

const ecs = {
    serviceName: 'CdkEcsStack-MyFargateService20200720ServiceE4C903D0-IYH2W2R80UUU',
    clusterName: 'CdkEcsStack-MyCDKCluster2020072050525F9D-hS40iRiwQg3s'
}

/*********************************************************/

import 'source-map-support/register';

import cdk = require('@aws-cdk/core');
import pipeline = require('@aws-cdk/aws-codepipeline');
import pipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require ('@aws-cdk/aws-codebuild');
import { BuildSpec } from '@aws-cdk/aws-codebuild';
import { Role, ManagedPolicy } from '@aws-cdk/aws-iam'

import { MyEcsDeployAction } from './MyEcsDeployAction';

const app = new cdk.App();

// create the stack
const pipelineStack = new cdk.Stack(app, `MyECSPipelineStack-${TAG}-01`, {});

// create the source action (github)
const sourceOutput = new pipeline.Artifact();
const sourceAction = new pipeline_actions.GitHubSourceAction({
    actionName: "GitHubTrigger",
    owner: github.owner,
    repo: github.repo,
    oauthToken: cdk.SecretValue.secretsManager(github.secret_manager_secret_name),
    output: sourceOutput,
    branch: 'master'
});

// create the build action
const buildProject = new codebuild.PipelineProject(pipelineStack, `CodeBuildProject-${TAG}`, {
  projectName: 'DockerBuild',
  buildSpec: BuildSpec.fromSourceFilename('nginx/buildspec.yml'),
  environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      privileged: true
  }
});

// add codebuild permissions to access ECR (to push the image to the repo)
const role = <Role>buildProject.role;
role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));

const buildOutput = new pipeline.Artifact();
const buildAction = new pipeline_actions.CodeBuildAction({
    actionName: 'CodeBuildDockerImage',
    project: buildProject,
    input: sourceOutput,
    outputs: [buildOutput]
});

// create the deploy action 

// as of today, it is not possible to create a BaseService from the cluster name or ARN
// workaround is to build the IAction object ourself
// https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ecs.BaseService.html
// https://github.com/aws/aws-cdk/issues/4375

const deployAction = new MyEcsDeployAction({
            actionName: 'Deploy',
            serviceName: ecs.serviceName,
            clusterName: ecs.clusterName,
            input: buildOutput,
        });
  // const deployAction = new pipeline_actions.EcsDeployAction({
  //   actionName: 'DeployAction',
  //   service: ecs.serviceName,
  //   // if your file is called imagedefinitions.json,
  //   // use the `input` property,
  //   // and leave out the `imageFile` property
  //   input: buildOutput,
  //   // if your file name is _not_ imagedefinitions.json,
  //   // use the `imageFile` property,
  //   // and leave out the `input` property
  //   // imageFile: sourceOutput.atPath('imageDef.json'),
  // });

// finally, create the pipeline
const codePipeline = new pipeline.Pipeline(pipelineStack, `Pipeline${TAG}`, {
    pipelineName: 'ECSDeploy',
    stages: [
      {
        stageName: 'GetSource',
        actions: [sourceAction],
      },
      {
        stageName: 'BuildDockerImage',
        actions: [buildAction]
      },
      {
        stageName: 'DeployToEcs',
        actions: [deployAction]
      }
    ],
  });  
