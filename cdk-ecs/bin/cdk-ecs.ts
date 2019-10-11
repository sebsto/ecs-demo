#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkEcsStack } from '../lib/cdk-ecs-stack';

const app = new cdk.App();
new CdkEcsStack(app, 'CdkEcsStack');
