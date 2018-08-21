# CloudClock

CloudClock is Kubernets cluster watch dogs that monitors cluster state for node autoscales and notifies an admin via slack.

  - Includes all Kubernetes manifest files
  - Automatically creates service accounts, cluster roles, and persitent volume claims

# New Features!

  - CloudClock is now packaged as a helm chart for simple, one-liner installs.

This text you see here is *actually* written in Markdown! To get a feel for Markdown's syntax, type some text into the left window and watch the results in the right.

### Installation
CloudClock requires a Slack bot to be created ahead of time. This bot is used to send notifications to admins. Once the bot is created, retrieve the slackToken for the next step.

You must include your slackToken as a value when installing CloudClock. Create a yaml file and paste in your slack Token. 
```yaml
slackToken: 'aaaaaaaaaaaaatokenherebbbbbbbbbbbb'
```
ClockClock will use the default Kubernetes storage class, if your cluster does not have a default storage class, you can include a storage class as a install value like the slack token
```yaml
slackToken: 'aaaaaaaaaaaaatokenherebbbbbbbbbbbb'
storageClassName: 'myClass'
```
You're now set to instal with helm
```sh
helm install -f <your values file here> cloudclock
```
