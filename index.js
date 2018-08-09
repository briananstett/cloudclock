const path = require('path');
const fs = require('fs');
const moment = require('moment');
const { WebClient } = require('@slack/client');
const async = require('async');

(async function main(){
    const token = process.env.SLACK_TOKEN;
    const mountPath = process.env.MOUNT_PATH || "/tmp";
    const file = process.env.FILE || 'nodeState.json';
    const slackChannels = require('/etc/slack/slackChannels.json');
    const clusterName = process.env.CLUSTER_NAME || 'internal-24g-cluster';
    const web = new WebClient(token);

    //Authentication for pod
        const Client = require('kubernetes-client').Client;
        const config = require('kubernetes-client').config;
        const client = new Client({ config: config.getInCluster() });

    //Authentication for running locally
    // const Client = require('kubernetes-client').Client;
    // const config = require('kubernetes-client').config;
    // const client = new Client({ config: config.fromKubeconfig(), version: '1.9' });

    await client.loadSpec();

    const storeFile = path.join(mountPath, file)

    
    var currentState = await getCurrentState(client).catch(error =>{console.log("There was a problem getting current state"); console.error(error)});
    var storedState = getStoredState(storeFile);

    //Update the currently stored cluster state
    setStoredState(currentState, storeFile);

    if(storedState.nodes && currentState.length != storedState.nodes.length){
        //TODO(developer) Send out notification
        var autoScaleChange = currentState.length - storedState.nodes.length;
        notifications(autoScaleChange, currentState, clusterName, {
            slack: {
                client: web,
                channels : slackChannels
            }
        });
    }

})()
    
    
    
/**
* Retrieves the stored cluster node state or initializes it.
* @param {string} storeFile The path of the mounted persistent store.
* @returns {object} The stored persistent cluster node state.
*/
function getStoredState(storeFile){
    try{
        //Pull current node state if already created
        var config = require(storeFile);
        return config 
    }catch(e){
        return {}

    }
    
}

/**
 * Retrieves the current list of nodes in the cluster.
 * @param {object} client Existing Kubernetes-client instance.
 * @returns {array} The current cluster node state.
 */
async function getCurrentState(client){
    try{
        var rawNodes = await client.api.v1.nodes.get();
        var nodes = rawNodes.body.items;
        var parsedNodes = [];
        nodes.forEach(node => {
            parsedNodes.push(node.metadata.name)
        });

        return parsedNodes;
    }catch(e){
        throw e
    }
    
}

/**
 * Writes current state to storage
 * @param {array} nodes Array of current cluster nodes
 * @param {string} storeFile The path of the persistent mount to store current state.
 */
function setStoredState(nodes, storeFile){
    console.log(nodes)
    var state = {
        timestamp: moment.utc().format(),
        nodes: nodes
    }
    
    fs.writeFile(storeFile, JSON.stringify(state), error=>{
        if (error) throw error
    })

}


/**
 * Notifies appropriate party about the cluster node changes.
 * @param {integer} delta The increase/decrease in cluster nodes. Can be possitive or negative change.
 * @param {array} nodes An array of nodes
 * @param {string} cluster Name of the cluster.
 * @param {object} options Which types of notifications do you want sent out
 */
function notifications(delta, nodes, cluster, options){
    if(delta > 0){
        var message = `Your cluster has auto scaled up ${Math.abs(delta)} node(s).`
    }else{
        var message = `Your cluster has auto scaled down ${Math.abs(delta)} node(s).`
    }

    Object.keys(options).forEach(key=>{
        if(key === 'slack'){
            let web = options[key].client;
            let channels = options[key].channels;

            let slackAttachment = {
                title: cluster,
                color: "#0000FF",
                text: message,
                fields: [],
                thumb_url: "http://www.stickpng.com/assets/images/58480a44cef1014c0b5e4917.png"
            }

            async.each(nodes, (node,callback)=>{
                slackAttachment.fields.push({
                    value: "`"+ node + "`",
                    short:false
                })
                callback();
            })
            

            channels.forEach(channel_id=>{
                web.chat.postMessage({ channel: channel_id, attachments: [slackAttachment], as_user: true })
                    .then((res) => {
                        // `res` contains information about the posted message
                        console.log('Message sent: ', res.ts);
                    })
                    .catch(console.error);
            })
        }
    })
}